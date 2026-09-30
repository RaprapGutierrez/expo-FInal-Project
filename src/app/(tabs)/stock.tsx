import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

type OrderItem = { name: string; qty: string; price: string };

type Order = {
  id: string;
  supplierName: string;
  branchName: string;
  items: OrderItem[];
  status: "Pending" | "In Transit" | "Delivered";
  step: number; // 0=Ordered 1=Shipped 2=Out for delivery 3=Delivered
};

const SAMPLE_ORDERS: Order[] = [
  {
    id: "ORD-001",
    supplierName: "VetPharma Supply Co.",
    branchName: "Angeles Main Branch",
    items: [
      { name: "Amoxicillin 250mg", qty: "10", price: "150" },
      { name: "Surgical Gloves (M)", qty: "20", price: "80" },
    ],
    status: "Pending",
    step: 0,
  },
  {
    id: "ORD-002",
    supplierName: "MedEquip Angeles",
    branchName: "Angeles Main Branch",
    items: [{ name: "Pet Shampoo (Anti-tick)", qty: "15", price: "220" }],
    status: "In Transit",
    step: 2,
  },
  {
    id: "ORD-003",
    supplierName: "PetCare Distributors",
    branchName: "Mabalacat Branch",
    items: [{ name: "Deworming Tablets", qty: "30", price: "45" }],
    status: "Delivered",
    step: 3,
  },
];

const SUPPLIERS = [
  "VetPharma Supply Co.",
  "MedEquip Angeles",
  "PetCare Distributors",
];
const BRANCHES = ["Angeles Main Branch", "Mabalacat Branch"];
const STEP_LABELS = ["Ordered", "Shipped", "Out for Delivery", "Delivered"];

const OTHER_OPTION = "Other (type manually)";

const SUPPLIER_PRODUCTS: Record<string, string[]> = {
  "VetPharma Supply Co.": [
    "Amoxicillin 250mg",
    "Surgical Gloves (M)",
    "Syringes 3mL",
    "IV Fluids (Lactated Ringer's)",
    "Antiseptic Solution",
  ],
  "MedEquip Angeles": [
    "Pet Shampoo (Anti-tick)",
    "Digital Thermometer",
    "Grooming Clippers",
    "Examination Table Pads",
  ],
  "PetCare Distributors": [
    "Deworming Tablets",
    "Flea & Tick Collar",
    "Vitamin Supplements",
    "Pet Carrier (Small)",
  ],
};

const SUPPLIER_COORD = { latitude: 15.1449, longitude: 120.5887 };
const BRANCH_COORD = { latitude: 15.1739, longitude: 120.5931 };

function StepTracker({ step }: { step: number }) {
  return (
    <View style={styles.trackerRow}>
      {STEP_LABELS.map((label, i) => (
        <View key={label} style={styles.trackerStepWrap}>
          <View style={styles.trackerLineGroup}>
            {i > 0 && (
              <View
                style={[
                  styles.trackerLine,
                  i <= step && styles.trackerLineDone,
                ]}
              />
            )}
          </View>
          <View style={[styles.trackerDot, i <= step && styles.trackerDotDone]}>
            {i <= step && <Ionicons name="checkmark" size={12} color="#fff" />}
          </View>
          <Text style={styles.trackerLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function itemsSummary(items: OrderItem[]) {
  return items.map((it) => `${it.name} (x${it.qty})`).join(", ");
}

// --- EMPLOYEE VIEW -----------------------------------------------------

type DraftItem = OrderItem & { customName: string };

function EmployeeInventory({
  orders,
  onCreateOrder,
}: {
  orders: Order[];
  onCreateOrder: (o: Order) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [supplierName, setSupplierName] = useState(SUPPLIERS[0]);
  const [branchName, setBranchName] = useState(BRANCHES[0]);
  const [items, setItems] = useState<DraftItem[]>([
    { name: "", customName: "", qty: "", price: "" },
  ]);

  const productOptions = [
    ...(SUPPLIER_PRODUCTS[supplierName] ?? []),
    OTHER_OPTION,
  ];

  const resolvedName = (it: DraftItem) =>
    it.name === OTHER_OPTION ? it.customName : it.name;

  const totalQty = items.reduce(
    (sum, it) => sum + (parseFloat(it.qty) || 0),
    0,
  );
  const totalPrice = items.reduce(
    (sum, it) => sum + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0),
    0,
  );

  const updateItem = (idx: number, field: keyof DraftItem, value: string) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    );
  };

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      { name: "", customName: "", qty: "", price: "" },
    ]);

  const onSupplierChange = (s: string) => {
    setSupplierName(s);
    // reset item selections since product list changes per supplier
    setItems([{ name: "", customName: "", qty: "", price: "" }]);
  };

  const confirm = () => {
    const validItems = items
      .map((it) => ({
        name: resolvedName(it),
        qty: it.qty,
        price: it.price,
      }))
      .filter((it) => it.name && it.qty);
    if (validItems.length === 0) return;
    onCreateOrder({
      id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      supplierName,
      branchName,
      items: validItems,
      status: "Pending",
      step: 0,
    });
    setItems([{ name: "", customName: "", qty: "", price: "" }]);
    setShowModal(false);
  };

  const lowStockCount = orders.filter((o) => o.status === "Pending").length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{orders.length}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={[styles.statCard, styles.statCardWarn]}>
            <Text style={[styles.statNum, styles.statNumWarn]}>
              {lowStockCount}
            </Text>
            <Text style={[styles.statLabel, styles.statLabelWarn]}>
              Low Stock
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>
              {orders.filter((o) => o.status === "In Transit").length}
            </Text>
            <Text style={styles.statLabel}>In Transit</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>
              {orders.filter((o) => o.status === "Delivered").length}
            </Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>All Orders</Text>
        {orders.map((o) => (
          <View key={o.id} style={styles.orderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderId}>
                {o.id} · {o.supplierName}
              </Text>
              <Text style={styles.orderMeta}>{o.branchName}</Text>
              <Text style={styles.orderItems} numberOfLines={2}>
                {itemsSummary(o.items)}
              </Text>
            </View>
            <View style={[styles.badge, badgeColor(o.status)]}>
              <Text style={styles.badgeText}>{o.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>ORDER NEW SUPPLIES</Text>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Supplier Name (filter)</Text>
                  <SimpleSelect
                    value={supplierName}
                    options={SUPPLIERS}
                    onSelect={onSupplierChange}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Branch Name</Text>
                  <SimpleSelect
                    value={branchName}
                    options={BRANCHES}
                    onSelect={setBranchName}
                  />
                </View>
              </View>

              {items.map((item, idx) => (
                <View key={idx} style={{ marginBottom: 8 }}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 2 }}>
                      <SimpleSelect
                        value={item.name || "Select product"}
                        options={productOptions}
                        onSelect={(v) => updateItem(idx, "name", v)}
                      />
                    </View>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Qty"
                      keyboardType="numeric"
                      value={item.qty}
                      onChangeText={(v) => updateItem(idx, "qty", v)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Price"
                      keyboardType="numeric"
                      value={item.price}
                      onChangeText={(v) => updateItem(idx, "price", v)}
                    />
                  </View>
                  {item.name === OTHER_OPTION && (
                    <TextInput
                      style={[styles.input, { marginTop: 6 }]}
                      placeholder="Type product name"
                      value={item.customName}
                      onChangeText={(v) => updateItem(idx, "customName", v)}
                    />
                  )}
                </View>
              ))}

              <TouchableOpacity onPress={addRow} style={styles.addRowBtn}>
                <Ionicons name="add-circle-outline" size={16} color="#1e3a8a" />
                <Text style={styles.addRowText}>Add item</Text>
              </TouchableOpacity>

              <View style={styles.totalsRow}>
                <Text style={styles.totalsText}>Total Qty: {totalQty}</Text>
                <Text style={styles.totalsText}>
                  Total Price: ₱{totalPrice.toFixed(2)}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={confirm}>
                  <Text style={styles.saveText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function EmployeeDelivery({ orders }: { orders: Order[] }) {
  const activeOrder = orders.find((o) => o.status !== "Delivered") ?? orders[0];
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.sectionTitle}>Delivery Tracking</Text>
      {activeOrder && (
        <View style={styles.trackerCard}>
          <Text style={styles.orderId}>
            {activeOrder.id} · {activeOrder.supplierName}
          </Text>
          <Text style={styles.orderItems}>
            {itemsSummary(activeOrder.items)}
          </Text>
          <StepTracker step={activeOrder.step} />
        </View>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        Delivery History
      </Text>
      {orders.map((o) => (
        <View key={o.id} style={styles.orderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>
              {o.id} · {o.branchName}
            </Text>
            <Text style={styles.orderMeta}>{o.supplierName}</Text>
            <Text style={styles.orderItems} numberOfLines={2}>
              {itemsSummary(o.items)}
            </Text>
          </View>
          <View style={[styles.badge, badgeColor(o.status)]}>
            <Text style={styles.badgeText}>{o.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// --- SUPPLIER VIEW -------------------------------------------------------

function SupplierDashboard({ orders }: { orders: Order[] }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {orders.filter((o) => o.status === "Pending").length}
          </Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {orders.filter((o) => o.status === "In Transit").length}
          </Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {orders.filter((o) => o.status === "Delivered").length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Orders</Text>
      {orders.map((o) => (
        <View key={o.id} style={styles.orderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>
              {o.id} · {o.branchName}
            </Text>
            <Text style={styles.orderItems} numberOfLines={2}>
              {itemsSummary(o.items)}
            </Text>
          </View>
          <View style={[styles.badge, badgeColor(o.status)]}>
            <Text style={styles.badgeText}>{o.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function SupplierOrders({
  orders,
  onUpdate,
}: {
  orders: Order[];
  onUpdate: (id: string, patch: Partial<Order>) => void;
}) {
  const [selected, setSelected] = useState<Order | null>(null);

  const acceptOrder = () => {
    if (!selected) return;
    onUpdate(selected.id, { status: "In Transit", step: 1 });
    setSelected(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>Order History</Text>
        {orders.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={styles.orderRow}
            onPress={() => o.status === "Pending" && setSelected(o)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.orderId}>
                {o.id} · {o.branchName}
              </Text>
              <Text style={styles.orderItems} numberOfLines={2}>
                {itemsSummary(o.items)}
              </Text>
            </View>
            <View style={[styles.badge, badgeColor(o.status)]}>
              <Text style={styles.badgeText}>{o.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>PENDING ORDER</Text>
              {selected && (
                <>
                  <Text style={styles.fieldLabel}>Branch Name</Text>
                  <View style={[styles.input, { justifyContent: "center" }]}>
                    <Text>{selected.branchName}</Text>
                  </View>

                  {selected.items.map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View
                        style={[
                          styles.input,
                          { flex: 2, justifyContent: "center" },
                        ]}
                      >
                        <Text>{it.name}</Text>
                      </View>
                      <View
                        style={[
                          styles.input,
                          { flex: 1, justifyContent: "center" },
                        ]}
                      >
                        <Text>{it.qty}</Text>
                      </View>
                      <View
                        style={[
                          styles.input,
                          { flex: 1, justifyContent: "center" },
                        ]}
                      >
                        <Text>₱{it.price}</Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsText}>
                      Total Qty:{" "}
                      {selected.items.reduce(
                        (s, it) => s + (parseFloat(it.qty) || 0),
                        0,
                      )}
                    </Text>
                    <Text style={styles.totalsText}>
                      Total Price: ₱
                      {selected.items
                        .reduce(
                          (s, it) =>
                            s +
                            (parseFloat(it.qty) || 0) *
                              (parseFloat(it.price) || 0),
                          0,
                        )
                        .toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setSelected(null)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={acceptOrder}>
                  <Text style={styles.saveText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function buildMapHtml() {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const supplier = [${SUPPLIER_COORD.latitude}, ${SUPPLIER_COORD.longitude}];
    const branch = [${BRANCH_COORD.latitude}, ${BRANCH_COORD.longitude}];

    const map = L.map('map').fitBounds([supplier, branch], { padding: [40, 40] });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.marker(supplier).addTo(map).bindPopup('Supplier Warehouse');
    L.marker(branch).addTo(map).bindPopup('Branch');

    fetch('https://router.project-osrm.org/route/v1/driving/' +
      ${SUPPLIER_COORD.longitude} + ',' + ${SUPPLIER_COORD.latitude} + ';' +
      ${BRANCH_COORD.longitude} + ',' + ${BRANCH_COORD.latitude} +
      '?overview=full&geometries=geojson')
      .then(res => res.json())
      .then(data => {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        L.polyline(coords, { color: '#7c3aed', weight: 4 }).addTo(map);
      })
      .catch(() => {
        L.polyline([supplier, branch], { color: '#7c3aed', weight: 4, dashArray: '6' }).addTo(map);
      });
  </script>
</body>
</html>
  `;
}

function SupplierMap() {
  const html = buildMapHtml();

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>Map w/ Navigation</Text>
      <View style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}>
        {Platform.OS === "web" ? (
          // @ts-ignore -- iframe is valid on web only
          <iframe
            srcDoc={html}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <WebView
            originWhitelist={["*"]}
            source={{ html }}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </View>
  );
}

function SupplierDeliveryUpdates({
  orders,
  onUpdate,
}: {
  orders: Order[];
  onUpdate: (id: string, patch: Partial<Order>) => void;
}) {
  const activeOrder = orders.find((o) => o.status !== "Delivered") ?? orders[0];

  const advanceStep = () => {
    if (!activeOrder) return;
    const nextStep = Math.min(activeOrder.step + 1, 3);
    onUpdate(activeOrder.id, {
      step: nextStep,
      status: nextStep >= 3 ? "Delivered" : "In Transit",
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.sectionTitle}>Delivery Tracking</Text>
      {activeOrder && (
        <>
          <View style={styles.trackerCard}>
            <Text style={styles.orderId}>
              {activeOrder.id} · {activeOrder.branchName}
            </Text>
            <Text style={styles.orderItems}>
              {itemsSummary(activeOrder.items)}
            </Text>
            <StepTracker step={activeOrder.step} />
          </View>
          <TouchableOpacity
            style={[
              styles.updateBtn,
              activeOrder.step >= 3 && styles.updateBtnDone,
            ]}
            onPress={advanceStep}
            disabled={activeOrder.step >= 3}
          >
            <Text style={styles.updateBtnText}>
              {activeOrder.step >= 3 ? "Delivered" : "Update Tracking"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

// --- SHARED PIECES -------------------------------------------------------

function SimpleSelect({
  value,
  options,
  onSelect,
}: {
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[styles.input, styles.selectInput]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.selectValue} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#94a3b8" />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.pickerCard}>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerRow}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.pickerRowText}>{opt}</Text>
                  {opt === value && (
                    <Ionicons name="checkmark" size={16} color="#1e3a8a" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function badgeColor(status: Order["status"]) {
  switch (status) {
    case "Pending":
      return { backgroundColor: "#fef9c3" };
    case "In Transit":
      return { backgroundColor: "#dbeafe" };
    case "Delivered":
      return { backgroundColor: "#dcfce7" };
  }
}

// --- ROOT SCREEN ----------------------------------------------------------

export default function StockScreen() {
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [role, setRole] = useState<"employee" | "supplier">("employee");
  const [empTab, setEmpTab] = useState<"inventory" | "delivery">("inventory");
  const [supTab, setSupTab] = useState<
    "dashboard" | "orders" | "map" | "updates"
  >("dashboard");

  const updateOrder = (id: string, patch: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.roleSwitcher}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "employee" && styles.roleBtnActive]}
          onPress={() => setRole("employee")}
        >
          <Text
            style={[
              styles.roleBtnText,
              role === "employee" && styles.roleBtnTextActive,
            ]}
          >
            Employee
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === "supplier" && styles.roleBtnActive]}
          onPress={() => setRole("supplier")}
        >
          <Text
            style={[
              styles.roleBtnText,
              role === "supplier" && styles.roleBtnTextActive,
            ]}
          >
            Supplier
          </Text>
        </TouchableOpacity>
      </View>

      {role === "employee" ? (
        <>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                empTab === "inventory" && styles.tabBtnActive,
              ]}
              onPress={() => setEmpTab("inventory")}
            >
              <Text
                style={[
                  styles.tabText,
                  empTab === "inventory" && styles.tabTextActive,
                ]}
              >
                Inventory
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                empTab === "delivery" && styles.tabBtnActive,
              ]}
              onPress={() => setEmpTab("delivery")}
            >
              <Text
                style={[
                  styles.tabText,
                  empTab === "delivery" && styles.tabTextActive,
                ]}
              >
                Delivery Tracking
              </Text>
            </TouchableOpacity>
          </View>
          {empTab === "inventory" ? (
            <EmployeeInventory
              orders={orders}
              onCreateOrder={(o) => setOrders((prev) => [o, ...prev])}
            />
          ) : (
            <EmployeeDelivery orders={orders} />
          )}
        </>
      ) : (
        <>
          <View style={styles.tabRow}>
            {(["dashboard", "orders", "map", "updates"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, supTab === t && styles.tabBtnActive]}
                onPress={() => setSupTab(t)}
              >
                <Text
                  style={[styles.tabText, supTab === t && styles.tabTextActive]}
                >
                  {t === "dashboard"
                    ? "Dashboard"
                    : t === "orders"
                      ? "Orders"
                      : t === "map"
                        ? "Map"
                        : "Updates"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {supTab === "dashboard" && <SupplierDashboard orders={orders} />}
          {supTab === "orders" && (
            <SupplierOrders orders={orders} onUpdate={updateOrder} />
          )}
          {supTab === "map" && <SupplierMap />}
          {supTab === "updates" && (
            <SupplierDeliveryUpdates orders={orders} onUpdate={updateOrder} />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  roleSwitcher: {
    flexDirection: "row",
    padding: 10,
    gap: 8,
    backgroundColor: "#f1f5f9",
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roleBtnActive: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  roleBtnText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  roleBtnTextActive: { color: "#fff" },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 6,
    paddingBottom: 8,
    backgroundColor: "#f1f5f9",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 6,
  },
  tabBtnActive: { backgroundColor: "#e0e7ff" },
  tabText: { fontSize: 11, fontWeight: "600", color: "#94a3b8" },
  tabTextActive: { color: "#1e3a8a" },

  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  statCardWarn: { backgroundColor: "#fef3c7" },
  statNum: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  statNumWarn: { color: "#92400e" },
  statLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
  statLabelWarn: { color: "#92400e" },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 10,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  orderId: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  orderMeta: { fontSize: 11, color: "#64748b", marginTop: 2 },
  orderItems: { fontSize: 11, color: "#475569", marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#1e293b" },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1e3a8a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    maxHeight: "88%",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 14,
  },
  formRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 4,
  },
  itemRow: { flexDirection: "row", gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 12,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: { fontSize: 12, color: "#1e293b", flexShrink: 1 },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
    marginTop: 4,
  },
  addRowText: { fontSize: 12, color: "#1e3a8a", fontWeight: "700" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f1f5f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  totalsText: { fontSize: 12, fontWeight: "700", color: "#1e293b" },
  modalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  cancelText: { color: "#64748b", fontWeight: "700" },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#1e3a8a",
  },
  saveText: { color: "#fff", fontWeight: "700" },

  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    width: "100%",
    maxWidth: 320,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  pickerRowText: { fontSize: 13, color: "#1e293b" },

  trackerCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  trackerRow: { flexDirection: "row", marginTop: 16 },
  trackerStepWrap: { flex: 1, alignItems: "center" },
  trackerLineGroup: {
    position: "absolute",
    top: 12,
    left: "-50%",
    width: "100%",
    height: 2,
  },
  trackerLine: { flex: 1, height: 2, backgroundColor: "#e2e8f0" },
  trackerLineDone: { backgroundColor: "#1e3a8a" },
  trackerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  trackerDotDone: { backgroundColor: "#1e3a8a" },
  trackerLabel: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 6,
    textAlign: "center",
  },

  updateBtn: {
    marginTop: 16,
    backgroundColor: "#1e3a8a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  updateBtnDone: { backgroundColor: "#94a3b8" },
  updateBtnText: { color: "#fff", fontWeight: "700" },
});
