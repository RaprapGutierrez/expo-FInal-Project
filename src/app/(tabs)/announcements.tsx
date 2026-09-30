import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Post = {
  id: string;
  title: string;
  body: string;
  type: "Announcement" | "Promotion" | "Event";
  date: string;
  imageUri?: string;
};

const TYPES: Post["type"][] = ["Announcement", "Promotion", "Event"];

type Role = "Client" | "Staff";

const formatDate = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const SAMPLE_POSTS: Post[] = [
  {
    id: "1",
    title: "Free Rabies Vaccination Drive",
    body: "Join our free rabies vaccination for all dogs and cats this Saturday, 9AM-3PM.",
    type: "Event",
    date: "Sep 27, 2026",
  },
  {
    id: "2",
    title: "20% Off Grooming Package",
    body: "Book a full grooming package this month and get 20% off. Walk-ins welcome.",
    type: "Promotion",
    date: "Sep 25, 2026",
  },
  {
    id: "3",
    title: "New Branch Hours",
    body: "Starting October, we'll be open until 8PM on weekdays to serve you better.",
    type: "Announcement",
    date: "Sep 20, 2026",
  },
];

export default function AnnouncementsScreen() {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [role, setRole] = useState<Role>("Client");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<Post["type"]>("Announcement");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setType("Announcement");
    setImageUri(null);
    setShowTagMenu(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to attach an image.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addPost = () => {
    if (role !== "Staff" || !title.trim() || !body.trim()) return;
    setPosts((prev) => [
      {
        id: Date.now().toString(),
        title,
        body,
        type,
        date: formatDate(),
        imageUri: imageUri || undefined,
      },
      ...prev,
    ]);
    resetForm();
    setShowAdd(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionHeader}>Announcements & Promotions</Text>

      <View style={styles.roleRow}>
        {(["Client", "Staff"] as Role[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleBtn, role === r && styles.roleBtnActive]}
            onPress={() => setRole(r)}
          >
            <Text
              style={[styles.roleText, role === r && styles.roleTextActive]}
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedPost(item)}
          >
            <View style={styles.cardMain}>
              <View style={[styles.tag, tagColor(item.type)]}>
                <Text style={styles.tagText}>{item.type}</Text>
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>

            {item.imageUri && (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.thumb}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        )}
      />

      {role === "Staff" && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {/* DETAILS MODAL */}
      <Modal visible={!!selectedPost} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeaderRow}>
              {selectedPost && (
                <View style={[styles.tag, tagColor(selectedPost.type)]}>
                  <Text style={styles.tagText}>{selectedPost.type}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedPost && (
              <ScrollView>
                <Text style={styles.detailsTitle}>{selectedPost.title}</Text>
                <Text style={styles.detailsBody}>{selectedPost.body}</Text>

                {selectedPost.imageUri && (
                  <Image
                    source={{ uri: selectedPost.imageUri }}
                    style={styles.detailsImage}
                    resizeMode="cover"
                  />
                )}

                <Text style={styles.date}>{selectedPost.date}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* NEW POST MODAL */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.formCard}>
            <View style={styles.formHeaderRow}>
              <Text style={styles.modalTitle}>New Post</Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setShowAdd(false);
                }}
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TouchableOpacity
                style={styles.tagDropdown}
                onPress={() => setShowTagMenu((v) => !v)}
              >
                <Text style={styles.tagDropdownText}>{type}</Text>
                <Ionicons
                  name={showTagMenu ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#64748b"
                />
              </TouchableOpacity>

              {showTagMenu && (
                <View style={styles.tagMenu}>
                  {TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={styles.tagMenuItem}
                      onPress={() => {
                        setType(t);
                        setShowTagMenu(false);
                      }}
                    >
                      <Text style={styles.tagMenuItemText}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Input Title"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.fieldLabel}>Details</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Input Text"
                value={body}
                onChangeText={setBody}
                multiline
              />

              <Text style={styles.fieldLabel}>Image (optional)</Text>
              <TouchableOpacity style={styles.attachBox} onPress={pickImage}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.attachPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={28}
                      color="#94a3b8"
                    />
                    <Text style={styles.attachBoxText}>
                      Tap to upload a photo
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  <Text style={styles.removeImageText}>Remove image</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.postBtn} onPress={addPost}>
                <Text style={styles.postBtnText}>POST</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function tagColor(type: Post["type"]) {
  switch (type) {
    case "Announcement":
      return { backgroundColor: "#dbeafe" };
    case "Promotion":
      return { backgroundColor: "#fef3c7" };
    case "Event":
      return { backgroundColor: "#dcfce7" };
  }
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardMain: { flex: 1, gap: 4 },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, fontWeight: "700", color: "#1e293b" },
  title: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  body: { fontSize: 13, color: "#475569", lineHeight: 18 },
  date: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
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
  detailsCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  detailsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  detailsBody: { fontSize: 14, color: "#475569", lineHeight: 20 },
  detailsImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    marginTop: 14,
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
  },
  formHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#1e293b" },
  tagDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
    alignSelf: "flex-start",
    minWidth: 160,
  },
  tagDropdownText: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  tagMenu: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  tagMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tagMenuItemText: { fontSize: 13, color: "#1e293b" },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
    fontSize: 14,
  },
  textarea: { height: 90, textAlignVertical: "top" },
  attachBox: {
    height: 130,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  attachPreview: { width: "100%", height: "100%" },
  attachBoxText: { fontSize: 12, color: "#94a3b8" },
  removeImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  removeImageText: { fontSize: 12, color: "#ef4444", fontWeight: "600" },
  postBtn: {
    backgroundColor: "#f59e0b",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 4,
  },
  postBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  roleRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  roleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  roleBtnActive: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  roleText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  roleTextActive: { color: "#fff" },
});
