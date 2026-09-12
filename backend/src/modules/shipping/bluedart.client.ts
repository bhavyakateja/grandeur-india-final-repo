import { logger } from "../../config/logger";
import { env } from "../../config/env";

export interface PincodeServiceabilityResult {
  pincode: string;
  isServiceable: boolean;
  prePaid: boolean;
  cod: boolean;
  city?: string;
  state?: string;
  expectedDeliveryDays?: number;
  estimatedDelivery?: string;
  transitDays?: number;
  availableServices?: string[];
  remarks?: string;
}

export interface ShippingRateInput {
  pincode: string;
  weightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface ShippingRateResult {
  pincode: string;
  isServiceable: boolean;
  rate: number;
  weightGrams: number;
  billableWeightGrams: number;
  transitDays?: number;
  estimatedDelivery?: string;
  courier: string;
  remarks?: string;
}

export interface BlueDartShipmentItem {
  name: string;
  sku?: string;
  units: number;
  selling_price: string | number;
  discount?: string | number;
  tax?: string | number;
  hsn_code?: string;
}

export interface CreateShipmentInput {
  orderNumber: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  totalAmount: number;
  paymentMode: "Pre-paid" | "COD";
  codAmount?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: string | number;
  }>;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  pickupLocation?: string;
}

export interface CreateShipmentResult {
  success: boolean;
  waybill: string;
  referenceNo: string;
  status: string;
  message?: string;
  destinationArea?: string;
  destinationLocation?: string;
  raw?: unknown;
}

export interface PickupRegistrationInput {
  orderNumber: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:mm (e.g. "14:00")
  packageCount?: number;
  weightKg?: number;
  volumeWeightKg?: number;
  contactPerson?: string;
  contactNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  remarks?: string;
}

export interface PickupRegistrationResult {
  success: boolean;
  tokenNumber?: string;
  pickupDate?: string;
  message?: string;
  raw?: unknown;
}

export interface TrackingScan {
  scanDateTime: string;
  scanType: string;
  scan: string;
  location: string;
  instructions?: string;
}

export interface TrackingResult {
  waybill: string;
  orderNumber?: string;
  status: string;
  statusDateTime?: string;
  expectedDeliveryDate?: string;
  origin?: string;
  destination?: string;
  scans: TrackingScan[];
}

export interface CancellationResult {
  success: boolean;
  message: string;
  waybill?: string;
  tokenNumber?: string;
}

/**
 * Blue Dart SOAP & Rate Client
 * Follows official DHL / Blue Dart Ver1.10 NetConnect SOAP APIs.
 * Supports sandbox mock mode when credentials are not configured.
 */
export class BlueDartClient {
  private loginId: string;
  private licenceKey: string;
  private customerCode: string;
  private apiType: string;
  private originArea: string;
  private originPincode: string;
  private productCode: string;
  private subProductCode: string;
  private baseUrl: string;
  private isConfigured: boolean;

  constructor() {
    this.loginId = env.BLUEDART_LOGIN_ID ?? "";
    this.licenceKey = env.BLUEDART_LICENCE_KEY ?? "";
    this.customerCode = env.BLUEDART_CUSTOMER_CODE ?? "";
    this.apiType = env.BLUEDART_API_TYPE ?? "S";
    this.originArea = env.BLUEDART_ORIGIN_AREA ?? "DEL";
    this.originPincode = env.BLUEDART_ORIGIN_PINCODE ?? "110001";
    this.productCode = env.BLUEDART_PRODUCT_CODE ?? "D";
    this.subProductCode = env.BLUEDART_SUB_PRODUCT_CODE ?? "P";

    const mode = env.BLUEDART_MODE ?? "staging";
    this.baseUrl =
      mode === "production"
        ? "https://netconnect.bluedart.com/Ver1.10/ShippingAPI"
        : "https://netconnect.bluedart.com/API-QA/Ver1.10/Demo/ShippingAPI";

    this.isConfigured = !!(this.loginId && this.licenceKey && this.customerCode);
  }

  /**
   * Constructs SOAP XML envelope for Blue Dart requests
   */
  private buildSoapEnvelope(serviceName: string, actionBody: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    ${actionBody}
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Helper to perform SOAP HTTP requests with isolation of secrets
   */
  private async executeSoapRequest(
    endpointUrl: string,
    soapAction: string,
    xmlBody: string
  ): Promise<string> {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: soapAction,
      },
      body: xmlBody,
    });

    if (!response.ok) {
      throw new Error(`Blue Dart SOAP request failed with HTTP status ${response.status}`);
    }

    return response.text();
  }

  /**
   * Simple XML tag extraction helper without external dependencies
   */
  private extractTagValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tagName}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?${tagName}>`, "i");
    const match = xml.match(regex);
    return match && match[1] ? match[1].trim() : null;
  }

  /**
   * Extract multiple instances of a tag from XML
   */
  private extractAllTagBlocks(xml: string, tagName: string): string[] {
    const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tagName}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?${tagName}>`, "gi");
    const results: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(xml)) !== null) {
      if (match[1]) {
        results.push(match[1]);
      }
    }
    return results;
  }

  /**
   * Check whether an Indian pincode is serviceable by Blue Dart.
   * Official method: GetServicesforPincode under ServiceFinderQuery.svc
   */
  async checkServiceability(pincode: string): Promise<PincodeServiceabilityResult> {
    const cleanPincode = pincode.trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return {
        pincode: cleanPincode,
        isServiceable: false,
        prePaid: false,
        cod: false,
        remarks: "Invalid pincode format. Must be exactly 6 digits.",
      };
    }

    // Return sandbox mock data if credentials are not configured
    if (!this.isConfigured) {
      const isMockServiceable = !cleanPincode.startsWith("99");
      const transitDays = 2 + (parseInt(cleanPincode.slice(-1), 10) % 3);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + transitDays);

      return {
        pincode: cleanPincode,
        isServiceable: isMockServiceable,
        prePaid: isMockServiceable,
        cod: isMockServiceable,
        city: "Mock Metro City",
        state: "Mock State",
        expectedDeliveryDays: isMockServiceable ? transitDays : undefined,
        transitDays: isMockServiceable ? transitDays : undefined,
        estimatedDelivery: isMockServiceable ? deliveryDate.toISOString().split("T")[0] : undefined,
        availableServices: isMockServiceable ? ["Domestic Priority (D)", "Surface (A)"] : [],
        remarks: isMockServiceable
          ? "Blue Dart Express Serviceable (Sandbox Mode)"
          : "Pincode not serviceable by Blue Dart.",
      };
    }

    try {
      const endpoint = `${this.baseUrl}/Finder/ServiceFinderQuery.svc`;
      const soapAction = "http://tempuri.org/IServiceFinderQuery/GetServicesforPincode";

      const actionBody = `
    <ser:GetServicesforPincode>
      <ser:pinCode>${cleanPincode}</ser:pinCode>
      <ser:profile>
        <ser:Api_type>${this.apiType}</ser:Api_type>
        <ser:LicenceKey>${this.licenceKey}</ser:LicenceKey>
        <ser:LoginID>${this.loginId}</ser:LoginID>
      </ser:profile>
    </ser:GetServicesforPincode>`;

      const soapXml = this.buildSoapEnvelope("ServiceFinderQuery", actionBody);
      const responseXml = await this.executeSoapRequest(endpoint, soapAction, soapXml);

      // Check response structure
      const isError = this.extractTagValue(responseXml, "IsError") === "true";
      const statusMessage = this.extractTagValue(responseXml, "StatusMessage") || "";

      if (isError) {
        return {
          pincode: cleanPincode,
          isServiceable: false,
          prePaid: false,
          cod: false,
          remarks: statusMessage || "Pincode is not serviceable by Blue Dart.",
        };
      }

      // Check available product codes
      const serviceBlocks = this.extractAllTagBlocks(responseXml, "ServicesProduct");
      const availableServices: string[] = [];
      let supportsPrepaid = false;
      let supportsCod = false;

      for (const block of serviceBlocks) {
        const prod = this.extractTagValue(block, "ProductCode") || "";
        const desc = this.extractTagValue(block, "ProductDescription") || prod;
        if (prod) {
          availableServices.push(`${desc} (${prod})`);
          if (prod === this.productCode || prod === "D" || prod === "A") {
            supportsPrepaid = true;
          }
        }
      }

      // If no specific service blocks found, parse standard inbound service flag
      const inboundService = this.extractTagValue(responseXml, "InboundService")?.toLowerCase();
      const isServiceable = inboundService === "yes" || availableServices.length > 0;
      supportsPrepaid = supportsPrepaid || isServiceable;
      supportsCod = supportsPrepaid; // Blue Dart supports COD where service is available with SubProduct

      const transitDaysStr = this.extractTagValue(responseXml, "TransitDays") || "3";
      const transitDays = parseInt(transitDaysStr, 10) || 3;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + transitDays);

      return {
        pincode: cleanPincode,
        isServiceable,
        prePaid: supportsPrepaid,
        cod: supportsCod,
        expectedDeliveryDays: isServiceable ? transitDays : undefined,
        transitDays: isServiceable ? transitDays : undefined,
        estimatedDelivery: isServiceable ? deliveryDate.toISOString().split("T")[0] : undefined,
        availableServices,
        remarks: isServiceable ? "Blue Dart Express Delivery Available" : "Pincode not serviceable by Blue Dart.",
      };
    } catch (error) {
      logger.error({ err: error, pincode: cleanPincode }, "Blue Dart pincode serviceability lookup failed");
      return {
        pincode: cleanPincode,
        isServiceable: false,
        prePaid: false,
        cod: false,
        remarks: "Blue Dart serviceability check is temporarily unavailable. Please try again later.",
      };
    }
  }

  /**
   * Authoritative backend shipping rate calculation based on weight slabs & volumetric weight
   * Volumetric weight formula: (L x W x H in cm) / 5000 = kg
   */
  async calculateRate(input: ShippingRateInput): Promise<ShippingRateResult> {
    const serviceability = await this.checkServiceability(input.pincode);

    // Calculate volumetric weight if dimensions are provided
    let volumetricWeightGrams = 0;
    if (input.lengthCm && input.widthCm && input.heightCm) {
      const volKg = (input.lengthCm * input.widthCm * input.heightCm) / 5000;
      volumetricWeightGrams = Math.round(volKg * 1000);
    }

    const billableWeightGrams = Math.max(input.weightGrams, volumetricWeightGrams);

    if (!serviceability.isServiceable) {
      return {
        pincode: input.pincode,
        isServiceable: false,
        rate: 0,
        weightGrams: input.weightGrams,
        billableWeightGrams,
        courier: "BLUEDART",
        remarks: serviceability.remarks ?? "Pincode not serviceable",
      };
    }

    // Weight slab calculation:
    // Base: First 500g = ₹80
    // Each additional 500g or part thereof = ₹40
    // Fuel surcharge: 10%
    // GST: 18%
    const baseWeightLimit = 500;
    const baseRate = 80;
    const additionalSlabRate = 40;

    let baseShippingCharge = baseRate;
    if (billableWeightGrams > baseWeightLimit) {
      const extraGrams = billableWeightGrams - baseWeightLimit;
      const extraSlabs = Math.ceil(extraGrams / 500);
      baseShippingCharge += extraSlabs * additionalSlabRate;
    }

    // Surcharges
    const fuelSurcharge = Math.round(baseShippingCharge * 0.10);
    const subtotal = baseShippingCharge + fuelSurcharge;
    const gst = Math.round(subtotal * 0.18);
    const finalRate = subtotal + gst;

    return {
      pincode: input.pincode,
      isServiceable: true,
      rate: finalRate,
      weightGrams: input.weightGrams,
      billableWeightGrams,
      transitDays: serviceability.transitDays ?? 3,
      estimatedDelivery: serviceability.estimatedDelivery,
      courier: "BLUEDART",
      remarks: "Calculated via Blue Dart domestic rate card",
    };
  }

  /**
   * Generate AWB / Waybill via Blue Dart SOAP API
   * Official method: GenerateWayBill under WayBillGeneration.svc
   */
  async generateWaybill(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured) {
      const mockWaybill = `BD${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
      logger.info(
        { orderNumber: input.orderNumber, waybill: mockWaybill },
        "Blue Dart credentials not configured: generated sandbox demo waybill"
      );
      return {
        success: true,
        waybill: mockWaybill,
        referenceNo: input.orderNumber,
        status: "Manifest Generated (Sandbox Demo)",
        destinationArea: "BOM",
        destinationLocation: input.city,
        message: "Shipment manifested successfully with Blue Dart (Sandbox Demo)",
      };
    }

    try {
      const endpoint = `${this.baseUrl}/WayBill/WayBillGeneration.svc`;
      const soapAction = "http://tempuri.org/IWayBillGeneration/GenerateWayBill";

      const weightKg = ((input.weightGrams ?? 500) / 1000).toFixed(2);
      const isCod = input.paymentMode === "COD";
      const codAmount = isCod ? (input.codAmount ?? input.totalAmount).toFixed(2) : "0.00";
      const totalAmountStr = input.totalAmount.toFixed(2);
      const itemDescription = input.items.map((i) => `${i.name} (x${i.quantity})`).join(", ").slice(0, 100);

      const actionBody = `
    <ser:GenerateWayBill>
      <ser:Request>
        <ser:Consignee>
          <ser:ConsigneeAddress1>${this.escapeXml(input.addressLine1)}</ser:ConsigneeAddress1>
          <ser:ConsigneeAddress2>${this.escapeXml(input.addressLine2 || "")}</ser:ConsigneeAddress2>
          <ser:ConsigneeAttention>${this.escapeXml(input.fullName)}</ser:ConsigneeAttention>
          <ser:ConsigneeMobile>${this.escapeXml(input.phone)}</ser:ConsigneeMobile>
          <ser:ConsigneeName>${this.escapeXml(input.fullName)}</ser:ConsigneeName>
          <ser:ConsigneePincode>${this.escapeXml(input.postalCode)}</ser:ConsigneePincode>
          <ser:ConsigneeTelephone>${this.escapeXml(input.phone)}</ser:ConsigneeTelephone>
        </ser:Consignee>
        <ser:Services>
          <ser:ActualWeight>${weightKg}</ser:ActualWeight>
          <ser:CollectableAmount>${codAmount}</ser:CollectableAmount>
          <ser:Commodity>
            <ser:CommodityDetail1>${this.escapeXml(itemDescription)}</ser:CommodityDetail1>
          </ser:Commodity>
          <ser:CreditCount>1</ser:CreditCount>
          <ser:DeclaredValue>${totalAmountStr}</ser:DeclaredValue>
          <ser:Dimensions>
            <ser:Dimension>
              <ser:Breadth>${input.widthCm ?? 10}</ser:Breadth>
              <ser:Count>1</ser:Count>
              <ser:Height>${input.heightCm ?? 10}</ser:Height>
              <ser:Length>${input.lengthCm ?? 10}</ser:Length>
            </ser:Dimension>
          </ser:Dimensions>
          <ser:InvoiceNo>${this.escapeXml(input.orderNumber)}</ser:InvoiceNo>
          <ser:PackType>Box</ser:PackType>
          <ser:PickupDate>${new Date().toISOString().split("T")[0]}</ser:PickupDate>
          <ser:PieceCount>1</ser:PieceCount>
          <ser:ProductCode>${this.productCode}</ser:ProductCode>
          <ser:ProductType>Dutiable</ser:ProductType>
          <ser:SubProductCode>${isCod ? "C" : this.subProductCode}</ser:SubProductCode>
        </ser:Services>
        <ser:Shipper>
          <ser:CustomerAddress1>Grandeur India Central Warehouse</ser:CustomerAddress1>
          <ser:CustomerCode>${this.customerCode}</ser:CustomerCode>
          <ser:CustomerName>Grandeur India</ser:CustomerName>
          <ser:CustomerPincode>${this.originPincode}</ser:CustomerPincode>
          <ser:OriginArea>${this.originArea}</ser:OriginArea>
          <ser:Sender>${this.escapeXml(input.pickupLocation || "Grandeur India")}</ser:Sender>
        </ser:Shipper>
      </ser:Request>
      <ser:Profile>
        <ser:Api_type>${this.apiType}</ser:Api_type>
        <ser:Customercode>${this.customerCode}</ser:Customercode>
        <ser:LicenceKey>${this.licenceKey}</ser:LicenceKey>
        <ser:LoginID>${this.loginId}</ser:LoginID>
      </ser:Profile>
    </ser:GenerateWayBill>`;

      const soapXml = this.buildSoapEnvelope("WayBillGeneration", actionBody);
      const responseXml = await this.executeSoapRequest(endpoint, soapAction, soapXml);

      const isError = this.extractTagValue(responseXml, "IsError") === "true";
      const statusInformation = this.extractTagValue(responseXml, "StatusInformation") || "";
      const waybillNo = this.extractTagValue(responseXml, "AWBNo");
      const destArea = this.extractTagValue(responseXml, "DestinationArea") || "";
      const destLocation = this.extractTagValue(responseXml, "DestinationLocation") || input.city;

      if (isError || !waybillNo) {
        logger.error({ order: input.orderNumber, statusInformation }, "Blue Dart waybill generation returned error");
        return {
          success: false,
          waybill: "",
          referenceNo: input.orderNumber,
          status: "FAILED",
          message: statusInformation || "Blue Dart did not return a valid waybill number",
        };
      }

      return {
        success: true,
        waybill: waybillNo,
        referenceNo: input.orderNumber,
        status: "MANIFESTED",
        destinationArea: destArea,
        destinationLocation: destLocation,
        message: "Shipment created successfully with Blue Dart",
      };
    } catch (error) {
      logger.error({ err: error, order: input.orderNumber }, "Failed to create Blue Dart shipment");
      return {
        success: false,
        waybill: "",
        referenceNo: input.orderNumber,
        status: "FAILED",
        message: error instanceof Error ? error.message : "Internal error connecting to Blue Dart",
      };
    }
  }

  /**
   * Register Pickup via Blue Dart SOAP API
   * Official method: RegisterPickup under PickupRegistration.svc
   */
  async registerPickup(input: PickupRegistrationInput): Promise<PickupRegistrationResult> {
    if (!this.isConfigured) {
      const mockToken = `BD-PU-${Date.now()}`;
      logger.info({ orderNumber: input.orderNumber, tokenNumber: mockToken }, "Sandbox pickup registered");
      return {
        success: true,
        tokenNumber: mockToken,
        pickupDate: input.pickupDate,
        message: "Pickup registered successfully with Blue Dart (Sandbox Demo)",
      };
    }

    try {
      const endpoint = `${this.baseUrl}/Pickup/PickupRegistration.svc`;
      const soapAction = "http://tempuri.org/IPickupRegistration/RegisterPickup";

      const actionBody = `
    <ser:RegisterPickup>
      <ser:request>
        <ser:AreaCode>${this.originArea}</ser:AreaCode>
        <ser:ContactPersonName>${this.escapeXml(input.contactPerson || "Warehouse Manager")}</ser:ContactPersonName>
        <ser:CustomerAddress1>${this.escapeXml(input.addressLine1 || "Grandeur India Central Warehouse")}</ser:CustomerAddress1>
        <ser:CustomerAddress2>${this.escapeXml(input.addressLine2 || "")}</ser:CustomerAddress2>
        <ser:CustomerCode>${this.customerCode}</ser:CustomerCode>
        <ser:CustomerName>Grandeur India</ser:CustomerName>
        <ser:CustomerPincode>${input.pincode || this.originPincode}</ser:CustomerPincode>
        <ser:CustomerTelephoneNumber>${this.escapeXml(input.contactNumber || "9999999999")}</ser:CustomerTelephoneNumber>
        <ser:DoxNDox>NonDox</ser:DoxNDox>
        <ser:PackageCount>${input.packageCount ?? 1}</ser:PackageCount>
        <ser:PickupDate>${input.pickupDate}</ser:PickupDate>
        <ser:PickupTime>${input.pickupTime}</ser:PickupTime>
        <ser:ProductCode>${this.productCode}</ser:ProductCode>
        <ser:ReferenceNo>${this.escapeXml(input.orderNumber)}</ser:ReferenceNo>
        <ser:Remarks>${this.escapeXml(input.remarks || "Standard Pickup")}</ser:Remarks>
        <ser:RouteCode>${this.originArea}</ser:RouteCode>
        <ser:Weight>${input.weightKg ?? 1.0}</ser:Weight>
        <ser:VolumeWeight>${input.volumeWeightKg ?? 1.0}</ser:VolumeWeight>
      </ser:request>
      <ser:profile>
        <ser:Api_type>${this.apiType}</ser:Api_type>
        <ser:Customercode>${this.customerCode}</ser:Customercode>
        <ser:LicenceKey>${this.licenceKey}</ser:LicenceKey>
        <ser:LoginID>${this.loginId}</ser:LoginID>
      </ser:profile>
    </ser:RegisterPickup>`;

      const soapXml = this.buildSoapEnvelope("PickupRegistration", actionBody);
      const responseXml = await this.executeSoapRequest(endpoint, soapAction, soapXml);

      const isError = this.extractTagValue(responseXml, "IsError") === "true";
      const statusMessage = this.extractTagValue(responseXml, "StatusMessage") || "";
      const tokenNumber = this.extractTagValue(responseXml, "TokenNumber");

      if (isError || !tokenNumber) {
        return {
          success: false,
          message: statusMessage || "Failed to register pickup with Blue Dart",
        };
      }

      return {
        success: true,
        tokenNumber,
        pickupDate: input.pickupDate,
        message: "Pickup registered successfully with Blue Dart",
      };
    } catch (error) {
      logger.error({ err: error, order: input.orderNumber }, "Failed to register Blue Dart pickup");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Pickup registration failed",
      };
    }
  }

  /**
   * Track an existing Blue Dart shipment by waybill
   * Official method: GetTrackingDetails under Tracking.svc
   */
  async trackShipment(waybill: string): Promise<TrackingResult> {
    if (!this.isConfigured) {
      const now = new Date().toISOString();
      return {
        waybill,
        status: "In Transit (Sandbox)",
        statusDateTime: now,
        expectedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
        origin: "DEL - Delhi Hub",
        destination: "BOM - Mumbai Hub",
        scans: [
          {
            scanDateTime: now,
            scanType: "PICKUP",
            scan: "Shipment Manifested and Picked Up by Blue Dart Courier",
            location: "Blue Dart Apex Hub, Delhi",
          },
          {
            scanDateTime: new Date(Date.now() - 3600000).toISOString(),
            scanType: "TRANSIT",
            scan: "In Transit to Destination Sorting Facility",
            location: "Blue Dart Transit Hub",
          },
        ],
      };
    }

    try {
      const endpoint = `${this.baseUrl}/Tracking/Tracking.svc`;
      const soapAction = "http://tempuri.org/ITracking/GetTrackingDetails";

      const actionBody = `
    <ser:GetTrackingDetails>
      <ser:numbers>${this.escapeXml(waybill)}</ser:numbers>
      <ser:profile>
        <ser:Api_type>${this.apiType}</ser:Api_type>
        <ser:LicenceKey>${this.licenceKey}</ser:LicenceKey>
        <ser:LoginID>${this.loginId}</ser:LoginID>
      </ser:profile>
    </ser:GetTrackingDetails>`;

      const soapXml = this.buildSoapEnvelope("Tracking", actionBody);
      const responseXml = await this.executeSoapRequest(endpoint, soapAction, soapXml);

      const status = this.extractTagValue(responseXml, "Status") || "IN_TRANSIT";
      const origin = this.extractTagValue(responseXml, "Origin") || undefined;
      const destination = this.extractTagValue(responseXml, "Destination") || undefined;
      const expectedDeliveryDate = this.extractTagValue(responseXml, "ExpectedDeliveryDate") || undefined;

      const scanBlocks = this.extractAllTagBlocks(responseXml, "ScanDetail");
      const scans: TrackingScan[] = scanBlocks.map((block) => ({
        scanDateTime: this.extractTagValue(block, "ScanDate") || new Date().toISOString(),
        scanType: this.extractTagValue(block, "ScanType") || "STATUS",
        scan: this.extractTagValue(block, "Scan") || "Status Update",
        location: this.extractTagValue(block, "ScannedLocation") || "In Transit",
        instructions: this.extractTagValue(block, "Instructions") || undefined,
      }));

      return {
        waybill,
        status,
        expectedDeliveryDate,
        origin,
        destination,
        scans,
      };
    } catch (error) {
      logger.error({ err: error, waybill }, "Blue Dart tracking error");
      return {
        waybill,
        status: "STATUS_UNAVAILABLE",
        scans: [],
      };
    }
  }

  /**
   * Cancel a waybill/AWB via Blue Dart SOAP API
   * Official method: CancelWaybill under WayBillGeneration.svc
   */
  async cancelWaybill(waybill: string): Promise<CancellationResult> {
    if (!this.isConfigured) {
      return {
        success: true,
        message: `Waybill ${waybill} cancelled successfully (Sandbox Mode)`,
        waybill,
      };
    }

    try {
      const endpoint = `${this.baseUrl}/WayBill/WayBillGeneration.svc`;
      const soapAction = "http://tempuri.org/IWayBillGeneration/CancelWaybill";

      const actionBody = `
    <ser:CancelWaybill>
      <ser:AWBNo>${this.escapeXml(waybill)}</ser:AWBNo>
      <ser:Profile>
        <ser:Api_type>${this.apiType}</ser:Api_type>
        <ser:Customercode>${this.customerCode}</ser:Customercode>
        <ser:LicenceKey>${this.licenceKey}</ser:LicenceKey>
        <ser:LoginID>${this.loginId}</ser:LoginID>
      </ser:Profile>
    </ser:CancelWaybill>`;

      const soapXml = this.buildSoapEnvelope("WayBillGeneration", actionBody);
      const responseXml = await this.executeSoapRequest(endpoint, soapAction, soapXml);

      const isError = this.extractTagValue(responseXml, "IsError") === "true";
      const statusMessage = this.extractTagValue(responseXml, "StatusMessage") || "";

      if (isError) {
        return {
          success: false,
          message: statusMessage || "Failed to cancel Blue Dart waybill",
          waybill,
        };
      }

      return {
        success: true,
        message: statusMessage || `Waybill ${waybill} cancelled successfully`,
        waybill,
      };
    } catch (error) {
      logger.error({ err: error, waybill }, "Blue Dart cancel waybill error");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error cancelling waybill",
        waybill,
      };
    }
  }

  /**
   * Cancel a pickup token via Blue Dart SOAP API
   */
  async cancelPickup(tokenNumber: string): Promise<CancellationResult> {
    if (!this.isConfigured) {
      return {
        success: true,
        message: `Pickup token ${tokenNumber} cancelled successfully (Sandbox Mode)`,
        tokenNumber,
      };
    }

    try {
      const endpoint = `${this.baseUrl}/Pickup/PickupRegistration.svc`;
      const soapAction = "http://tempuri.org/IPickupRegistration/CancelPickup";

      const actionBody = `
    <ser:CancelPickup>
      <ser:TokenNumber>${this.escapeXml(tokenNumber)}</ser:TokenNumber>
      <ser:profile>
        <ser:Api_type>${this.apiType}</ser:Api_type>
        <ser:Customercode>${this.customerCode}</ser:Customercode>
        <ser:LicenceKey>${this.licenceKey}</ser:LicenceKey>
        <ser:LoginID>${this.loginId}</ser:LoginID>
      </ser:profile>
    </ser:CancelPickup>`;

      const soapXml = this.buildSoapEnvelope("PickupRegistration", actionBody);
      const responseXml = await this.executeSoapRequest(endpoint, soapAction, soapXml);

      const isError = this.extractTagValue(responseXml, "IsError") === "true";
      const statusMessage = this.extractTagValue(responseXml, "StatusMessage") || "";

      if (isError) {
        return {
          success: false,
          message: statusMessage || "Failed to cancel Blue Dart pickup",
          tokenNumber,
        };
      }

      return {
        success: true,
        message: statusMessage || `Pickup ${tokenNumber} cancelled successfully`,
        tokenNumber,
      };
    } catch (error) {
      logger.error({ err: error, tokenNumber }, "Blue Dart cancel pickup error");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error cancelling pickup",
        tokenNumber,
      };
    }
  }

  /**
   * Get printable packing slip / shipping label URL for Blue Dart
   */
  getPackingSlip(waybill: string): string {
    return `https://www.bluedart.com/tracking?handler=waybill&action=print&track=${encodeURIComponent(waybill)}`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}

export const blueDartClient = new BlueDartClient();
