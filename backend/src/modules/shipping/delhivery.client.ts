import { logger } from "../../config/logger";

export interface PincodeServiceabilityResult {
  pincode: string;
  isServiceable: boolean;
  prePaid: boolean;
  cod: boolean;
  city?: string;
  state?: string;
  expectedDeliveryDays?: number;
  remarks?: string;
}

export interface DelhiveryShipmentItem {
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
  pickupLocation?: string;
}

export interface CreateShipmentResult {
  success: boolean;
  waybill: string;
  referenceNo: string;
  status: string;
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

export class DelhiveryClient {
  private apiToken: string;
  private baseUrl: string;
  private pickupLocation: string;
  private isConfigured: boolean;

  constructor() {
    this.apiToken = process.env.DELHIVERY_API_TOKEN ?? "";
    const mode = (process.env.DELHIVERY_MODE ?? "staging").toLowerCase();
    this.baseUrl =
      mode === "production"
        ? "https://track.delhivery.com"
        : "https://staging-express.delhivery.com";
    this.pickupLocation =
      process.env.DELHIVERY_PICKUP_LOCATION ?? "Grandeur India Warehouse";
    this.isConfigured = !!this.apiToken && this.apiToken.trim().length > 0;
  }

  /**
   * Check whether an Indian pincode is serviceable by Delhivery B2C.
   */
  async checkPincode(pincode: string): Promise<PincodeServiceabilityResult> {
    const cleanPincode = pincode.trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return {
        pincode: cleanPincode,
        isServiceable: false,
        prePaid: false,
        cod: false,
        remarks: "Invalid Indian PIN code format (must be 6 digits).",
      };
    }

    if (!this.isConfigured) {
      // Mock / fallback serviceability for testing when no live Delhivery token is in env
      logger.info(
        { pincode: cleanPincode },
        "Delhivery token not set: returning mock serviceability result",
      );
      // Valid Indian pincodes start with 1-8
      const firstDigit = Number(cleanPincode[0]);
      const isMockServiceable = firstDigit >= 1 && firstDigit <= 8;
      return {
        pincode: cleanPincode,
        isServiceable: isMockServiceable,
        prePaid: true,
        cod: true,
        city: "Major Hub",
        state: "India",
        expectedDeliveryDays: 3,
        remarks: isMockServiceable
          ? "Delhivery Express Serviceable (Sandbox Demo)"
          : "PIN code not in service area",
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/c/api/pin-codes/json/?filter_codes=${cleanPincode}`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${this.apiToken}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Delhivery API returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        delivery_codes?: Array<{
          postal_code?: {
            pin?: number | string;
            pre_paid?: string;
            cod?: string;
            is_oda?: string;
            sort_code?: string;
            city?: string;
            state?: string;
            remarks?: string;
          };
        }>;
      };

      const codeData = data.delivery_codes?.[0]?.postal_code;
      if (!codeData) {
        return {
          pincode: cleanPincode,
          isServiceable: false,
          prePaid: false,
          cod: false,
          remarks: "Pincode not serviceable by Delhivery.",
        };
      }

      const prePaid = codeData.pre_paid === "Y";
      const cod = codeData.cod === "Y";
      const isServiceable = prePaid || cod;

      return {
        pincode: cleanPincode,
        isServiceable,
        prePaid,
        cod,
        city: codeData.city,
        state: codeData.state,
        expectedDeliveryDays: codeData.is_oda === "Y" ? 5 : 3,
        remarks: isServiceable
          ? "Delhivery Express Delivery Available"
          : "Pincode not currently serviceable",
      };
    } catch (error) {
      logger.error({ err: error, pincode: cleanPincode }, "Delhivery pincode check error");
      // Do not claim serviceability when the carrier cannot be reached.
      return {
        pincode: cleanPincode,
        isServiceable: false,
        prePaid: false,
        cod: false,
        remarks: "Delhivery serviceability is temporarily unavailable. Please try again.",
      };
    }
  }

  /**
   * Create shipment manifest and register order with Delhivery B2C.
   */
  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.isConfigured) {
      // Mock generation for sandbox / test environment
      const mockWaybill = `DLHV${Date.now().toString().slice(-9)}`;
      logger.info(
        { orderNumber: input.orderNumber, mockWaybill },
        "Delhivery token not configured: generated sandbox demo waybill",
      );
      return {
        success: true,
        waybill: mockWaybill,
        referenceNo: input.orderNumber,
        status: "Manifested (Sandbox Demo)",
        message: "Shipment manifested successfully in sandbox mode.",
      };
    }

    const payload = {
      shipments: [
        {
          name: input.fullName,
          add: `${input.addressLine1}${input.addressLine2 ? `, ${input.addressLine2}` : ""}`,
          pin: input.postalCode,
          city: input.city,
          state: input.state,
          country: input.country || "India",
          phone: input.phone,
          order: input.orderNumber,
          payment_mode: input.paymentMode,
          return_pin: input.postalCode,
          return_city: input.city,
          return_phone: input.phone,
          return_add: input.addressLine1,
          return_state: input.state,
          return_country: input.country || "India",
          products_desc: input.items.map((it) => it.name).join(", "),
          hsn_code: "7113", // Jewellery HSN
          cod_amount: input.paymentMode === "COD" ? String(input.codAmount ?? input.totalAmount) : "0",
          order_date: new Date().toISOString(),
          total_amount: String(input.totalAmount),
          seller_add: "",
          seller_name: "Grandeur India",
          seller_inv: input.orderNumber,
          quantity: String(input.items.reduce((acc, it) => acc + it.quantity, 0)),
          weight: String(input.weightGrams ?? 500),
          shipment_width: "15",
          shipment_height: "10",
          shipment_length: "15",
        },
      ],
      pickup_location: {
        name: input.pickupLocation ?? this.pickupLocation,
      },
    };

    try {
      const bodyParams = new URLSearchParams();
      bodyParams.set("format", "json");
      bodyParams.set("data", JSON.stringify(payload));

      const response = await fetch(`${this.baseUrl}/api/cmu/create.json`, {
        method: "POST",
        headers: {
          Authorization: `Token ${this.apiToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: bodyParams.toString(),
      });

      const data = (await response.json()) as {
        success?: boolean;
        upload_wbn?: string;
        packages?: Array<{
          waybill?: string;
          refnum?: string;
          status?: string;
          remarks?: string[];
        }>;
        rmk?: string;
      };

      const pkg = data.packages?.[0];
      if (!pkg?.waybill) {
        throw new Error(
          pkg?.remarks?.join(", ") || data.rmk || "Delhivery did not return a valid waybill",
        );
      }

      return {
        success: true,
        waybill: pkg.waybill,
        referenceNo: pkg.refnum || input.orderNumber,
        status: pkg.status || "Manifested",
        message: "Shipment created successfully with Delhivery B2C",
        raw: data,
      };
    } catch (error) {
      logger.error({ err: error, order: input.orderNumber }, "Failed to create Delhivery shipment");
      throw error;
    }
  }

  /**
   * Track an existing Delhivery shipment by waybill or reference order number.
   */
  async trackShipment(waybill: string): Promise<TrackingResult> {
    if (!this.isConfigured || waybill.startsWith("DLHV")) {
      // Mock tracking timeline for sandbox
      return {
        waybill,
        status: "IN_TRANSIT",
        statusDateTime: new Date().toISOString(),
        expectedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        origin: "Grandeur Hub, Mumbai",
        destination: "Customer Destination",
        scans: [
          {
            scanDateTime: new Date(Date.now() - 3600000 * 24).toISOString(),
            scanType: "UD",
            scan: "Shipment Manifested by Grandeur India",
            location: "Grandeur Logistics Centre",
          },
          {
            scanDateTime: new Date(Date.now() - 3600000 * 12).toISOString(),
            scanType: "PP",
            scan: "Package Picked Up by Delhivery Express Courier",
            location: "Delhivery Hub, Mumbai",
          },
          {
            scanDateTime: new Date(Date.now() - 3600000 * 2).toISOString(),
            scanType: "IT",
            scan: "In Transit to Destination Processing Center",
            location: "Regional Sorting Facility",
          },
        ],
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${this.apiToken}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Delhivery Tracking API returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        ShipmentData?: Array<{
          Shipment?: {
            AWB?: string;
            ReferenceNo?: string;
            Status?: {
              Status?: string;
              StatusDateTime?: string;
              StatusType?: string;
              Instructions?: string;
            };
            Origin?: string;
            Destination?: string;
            ExpectedDeliveryDate?: string;
            Scans?: Array<{
              ScanDetail?: {
                ScanDateTime?: string;
                ScanType?: string;
                Scan?: string;
                ScannedLocation?: string;
                Instructions?: string;
              };
            }>;
          };
        }>;
      };

      const shipment = data.ShipmentData?.[0]?.Shipment;
      if (!shipment) {
        return {
          waybill,
          status: "PENDING_PICKUP",
          scans: [],
        };
      }

      const scans: TrackingScan[] = (shipment.Scans ?? []).map((s) => ({
        scanDateTime: s.ScanDetail?.ScanDateTime ?? "",
        scanType: s.ScanDetail?.ScanType ?? "",
        scan: s.ScanDetail?.Scan ?? "",
        location: s.ScanDetail?.ScannedLocation ?? "",
        instructions: s.ScanDetail?.Instructions,
      }));

      return {
        waybill: shipment.AWB || waybill,
        orderNumber: shipment.ReferenceNo,
        status: shipment.Status?.Status || "MANIFESTED",
        statusDateTime: shipment.Status?.StatusDateTime,
        expectedDeliveryDate: shipment.ExpectedDeliveryDate,
        origin: shipment.Origin,
        destination: shipment.Destination,
        scans,
      };
    } catch (error) {
      logger.error({ err: error, waybill }, "Delhivery tracking error");
      return {
        waybill,
        status: "DISPATCHED",
        scans: [],
      };
    }
  }

  /**
   * Get printable packing slip / label link from Delhivery.
   */
  async getPackingSlip(waybill: string): Promise<string> {
    if (!this.isConfigured || waybill.startsWith("DLHV")) {
      return `https://staging-express.delhivery.com/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&style=slip`;
    }
    return `${this.baseUrl}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&style=slip`;
  }
}

export const delhiveryClient = new DelhiveryClient();
