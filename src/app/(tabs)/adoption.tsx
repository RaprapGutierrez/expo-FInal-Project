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
  useWindowDimensions,
  View,
} from "react-native";

const HERO_IMAGE = require("../../../assets/images/A-happy-adopted-pet-with-a-person.jpeg");

const DOG_IMAGES = [
  require("../../../assets/images/dog1.jpeg"),
  require("../../../assets/images/dog2.jpg"),
  require("../../../assets/images/dog3.jpeg"),
  require("../../../assets/images/dog4.jpeg"),
  require("../../../assets/images/dog5.jpeg"),
  require("../../../assets/images/dog6.jpeg"),
];

const CAT_IMAGES = [
  require("../../../assets/images/cat1.jpg"),
  require("../../../assets/images/cat2.jpeg"),
  require("../../../assets/images/cat3.jpeg"),
  require("../../../assets/images/cat4.jpeg"),
  require("../../../assets/images/cat5.jpeg"),
  require("../../../assets/images/cat6.jpeg"),
];

const SPECIES_OPTIONS = ["Dog", "Cat"] as const;

const BREEDS_BY_SPECIES: Record<string, string[]> = {
  Dog: [
    "Aspin",
    "Aspin (Spotted)",
    "Aspin Mix",
    "Beagle",
    "Jack Russell Mix",
    "Shih Tzu",
    "Labrador Mix",
    "Poodle Mix",
    "Other",
  ],
  Cat: ["Puspin", "Puspin (Tabby)", "Persian", "Siamese", "Tabby", "Other"],
};

const AGE_OPTIONS = [
  "Below 6 months",
  "6 months - 1 year",
  "1 - 3 years",
  "3 - 7 years",
  "7+ years",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getPetImageSource(pet: Pet) {
  if (pet.customImageUri) return { uri: pet.customImageUri };
  const pool = pet.species === "Cat" ? CAT_IMAGES : DOG_IMAGES;
  if (typeof pet.imageIndex === "number") {
    return pool[pet.imageIndex % pool.length];
  }
  let hash = 0;
  for (let i = 0; i < pet.id.length; i++)
    hash = pet.id.charCodeAt(i) + ((hash << 5) - hash);
  return pool[Math.abs(hash) % pool.length];
}

function formatDate(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

type Pet = {
  id: string;
  species: string;
  breed: string;
  age: string;
  birthday: string;
  antiRabies: string;
  coreVaccine: string;
  antiTickFlea: string;
  description: string;
  status: "Available" | "Pending" | "Adopted";
  postedBy: string;
  imageIndex?: number;
  customImageUri?: string;
};

const SAMPLE_PETS: Pet[] = [
  {
    id: "1",
    species: "Dog",
    breed: "Aspin",
    age: "6 months - 1 year",
    birthday: "January 01, 2025",
    antiRabies: "Up to date",
    coreVaccine: "Complete",
    antiTickFlea: "Applied",
    description: "Friendly and playful, good with kids.",
    status: "Available",
    postedBy: "Chi Villanueva Datu",
    imageIndex: 0,
  },
  {
    id: "2",
    species: "Dog",
    breed: "Aspin (Spotted)",
    age: "1 - 3 years",
    birthday: "August 20, 2024",
    antiRabies: "Up to date",
    coreVaccine: "Complete",
    antiTickFlea: "Applied",
    description: "Small and gentle, great apartment dog.",
    status: "Available",
    postedBy: "Milcah Datu",
    imageIndex: 1,
  },
  {
    id: "3",
    species: "Dog",
    breed: "Aspin Mix",
    age: "1 - 3 years",
    birthday: "May 14, 2023",
    antiRabies: "Up to date",
    coreVaccine: "Complete",
    antiTickFlea: "Applied",
    description: "Energetic and loves to play fetch.",
    status: "Available",
    postedBy: "Andrew Bitun",
    imageIndex: 2,
  },
  {
    id: "4",
    species: "Dog",
    breed: "Aspin",
    age: "Below 6 months",
    birthday: "January 30, 2026",
    antiRabies: "Pending",
    coreVaccine: "1st dose",
    antiTickFlea: "Applied",
    description: "Curious pup still learning basic commands.",
    status: "Pending",
    postedBy: "Chi Villanueva Datu",
    imageIndex: 3,
  },
  {
    id: "5",
    species: "Dog",
    breed: "Beagle",
    age: "3 - 7 years",
    birthday: "July 2, 2021",
    antiRabies: "Up to date",
    coreVaccine: "Complete",
    antiTickFlea: "Applied",
    description: "Loyal and great with other dogs.",
    status: "Adopted",
    postedBy: "Milcah Datu",
    imageIndex: 4,
  },
  {
    id: "6",
    species: "Dog",
    breed: "Jack Russell Mix",
    age: "1 - 3 years",
    birthday: "October 10, 2025",
    antiRabies: "Up to date",
    coreVaccine: "Complete",
    antiTickFlea: "Applied",
    description: "Hypoallergenic coat, very affectionate.",
    status: "Available",
    postedBy: "Andrew Bitun",
    imageIndex: 5,
  },
  {
    id: "7",
    species: "Cat",
    breed: "Puspin",
    age: "Below 6 months",
    birthday: "March 12, 2025",
    antiRabies: "Pending",
    coreVaccine: "1st dose",
    antiTickFlea: "Applied",
    description: "Shy at first but very affectionate once comfortable.",
    status: "Pending",
    postedBy: "Andrew Bitun",
    imageIndex: 0,
  },
  {
    id: "8",
    species: "Cat",
    breed: "Puspin",
    age: "3 - 7 years",
    birthday: "June 5, 2022",
    antiRabies: "Up to date",
    coreVaccine: "Complete",
    antiTickFlea: "Applied",
    description: "Calm and low-maintenance, loves to nap.",
    status: "Adopted",
    postedBy: "Milcah Datu",
    imageIndex: 1,
  },
  {
    id: "9",
    species: "Cat",
    breed: "Puspin",
    age: "1 - 3 years",
    birthday: "April 18, 2024",
    antiRabies: "Up to date",
    coreVaccine: "Complete",
    antiTickFlea: "Applied",
    description: "Independent but enjoys a good chin scratch.",
    status: "Available",
    postedBy: "Chi Villanueva Datu",
    imageIndex: 2,
  },
  {
    id: "10",
    species: "Cat",
    breed: "Puspin (Tabby)",
    age: "6 months - 1 year",
    birthday: "December 1, 2025",
    antiRabies: "Up to date",
    coreVaccine: "Complete",
    antiTickFlea: "Applied",
    description: "Talkative and loves attention.",
    status: "Available",
    postedBy: "Milcah Datu",
    imageIndex: 3,
  },
  {
    id: "11",
    species: "Cat",
    breed: "Tabby",
    age: "1 - 3 years",
    birthday: "February 9, 2023",
    antiRabies: "Pending",
    coreVaccine: "1st dose",
    antiTickFlea: "Applied",
    description: "Sweet and gets along well with other cats.",
    status: "Pending",
    postedBy: "Andrew Bitun",
    imageIndex: 4,
  },
  {
    id: "12",
    species: "Cat",
    breed: "Puspin",
    age: "7+ years",
    birthday: "September 22, 2021",
    antiRabies: "Up to date",
    coreVaccine: "Complete",
    antiTickFlea: "Applied",
    description: "Quiet senior cat looking for a calm home.",
    status: "Adopted",
    postedBy: "Chi Villanueva Datu",
    imageIndex: 5,
  },
];

export default function AdoptionScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width > 900 ? 3 : width > 600 ? 2 : 1;
  const isMobile = width <= 600;

  const [pets, setPets] = useState<Pet[]>(SAMPLE_PETS);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // message dialog
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");

  // form fields
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [birthdayDate, setBirthdayDate] = useState<Date | null>(null);
  const [antiRabies, setAntiRabies] = useState("");
  const [coreVaccine, setCoreVaccine] = useState("");
  const [antiTickFlea, setAntiTickFlea] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [showSpeciesMenu, setShowSpeciesMenu] = useState(false);
  const [showBreedMenu, setShowBreedMenu] = useState(false);
  const [showAgeMenu, setShowAgeMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState(new Date());

  const resetForm = () => {
    setSpecies("");
    setBreed("");
    setAge("");
    setBirthdayDate(null);
    setAntiRabies("");
    setCoreVaccine("");
    setAntiTickFlea("");
    setDescription("");
    setImageUri(null);
    setShowSpeciesMenu(false);
    setShowBreedMenu(false);
    setShowAgeMenu(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload an image.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadPet = () => {
    if (!species || !breed) return;
    setPets((prev) => [
      {
        id: Date.now().toString(),
        species,
        breed,
        age: age || "Unknown age",
        birthday: birthdayDate ? formatDate(birthdayDate) : "Not specified",
        antiRabies: antiRabies || "Not yet",
        coreVaccine: coreVaccine || "Not yet",
        antiTickFlea: antiTickFlea || "Not yet",
        description,
        status: "Available",
        postedBy: "You",
        customImageUri: imageUri || undefined,
      },
      ...prev,
    ]);
    resetForm();
    setShowAdd(false);
  };

  const markAdopted = (id: string) => {
    setPets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Pending" } : p)),
    );
    setSelectedPet((prev) =>
      prev && prev.id === id ? { ...prev, status: "Pending" } : prev,
    );
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedPet) return;
    Alert.alert(
      "Message sent",
      `Your message to ${selectedPet.postedBy} about ${selectedPet.breed} has been sent:\n\n"${messageText.trim()}"`,
    );
    setMessageText("");
    setShowMessage(false);
  };

  // ---- calendar helpers ----
  const daysInMonth = new Date(
    calendarView.getFullYear(),
    calendarView.getMonth() + 1,
    0,
  ).getDate();
  const firstWeekday = new Date(
    calendarView.getFullYear(),
    calendarView.getMonth(),
    1,
  ).getDay();
  const calendarCells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const changeMonth = (delta: number) => {
    setCalendarView(
      new Date(calendarView.getFullYear(), calendarView.getMonth() + delta, 1),
    );
  };

  const pickDay = (day: number) => {
    setBirthdayDate(
      new Date(calendarView.getFullYear(), calendarView.getMonth(), day),
    );
    setShowCalendar(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        key={numColumns}
        data={pets}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={[
          { padding: isMobile ? 12 : 20, gap: isMobile ? 12 : 16 },
        ]}
        columnWrapperStyle={
          numColumns > 1 ? { gap: isMobile ? 12 : 16 } : undefined
        }
        ListHeaderComponent={
          <View style={[styles.hero, isMobile && styles.heroMobile]}>
            <View
              style={
                isMobile
                  ? { width: "100%" }
                  : {
                      flex: 1,
                      minWidth: 220,
                      height: 260,
                      justifyContent: "space-between",
                    }
              }
            >
              <Text style={styles.heroTitle}>
                HELP US{"\n"}FIND A{"\n"}HOME
              </Text>
              <Text style={styles.heroSub}>
                Give a loving pet a second chance at a happy home. Browse pets
                available for adoption and find a companion who needs your care
                and love.
              </Text>
              <View style={styles.heroDivider} />
            </View>
            <Image
              source={HERO_IMAGE}
              style={[
                styles.heroImageBox,
                isMobile && {
                  width: "100%",
                  height: undefined,
                  aspectRatio: 1,
                },
              ]}
              resizeMode="cover"
            />
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                flexBasis:
                  numColumns === 3 ? "31%" : numColumns === 2 ? "48%" : "100%",
              },
            ]}
            onPress={() => setSelectedPet(item)}
          >
            <Image
              source={getPetImageSource(item)}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <Text style={styles.cardCaption}>
              {item.species} · {item.breed} · {item.age}
            </Text>
            <View style={[styles.badge, badgeColor(item.status)]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* DETAILS MODAL */}
      <Modal visible={!!selectedPet} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailsCard}>
            {selectedPet && (
              <Image
                source={getPetImageSource(selectedPet)}
                style={styles.detailsImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.detailsTitle}>DETAILS</Text>

            {selectedPet && (
              <View style={{ gap: 4, marginTop: 8 }}>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailLabel}>Species: </Text>
                  {selectedPet.species}
                </Text>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailLabel}>Breed: </Text>
                  {selectedPet.breed}
                </Text>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailLabel}>Age: </Text>
                  {selectedPet.age}
                </Text>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailLabel}>Birthday: </Text>
                  {selectedPet.birthday}
                </Text>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailLabel}>Anti-rabies: </Text>
                  {selectedPet.antiRabies}
                </Text>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailLabel}>Core Vaccine: </Text>
                  {selectedPet.coreVaccine}
                </Text>
                <Text style={styles.detailLine}>
                  <Text style={styles.detailLabel}>Anti tick & flea: </Text>
                  {selectedPet.antiTickFlea}
                </Text>
                {selectedPet.description ? (
                  <Text style={styles.detailDesc}>
                    {selectedPet.description}
                  </Text>
                ) : null}
                <TouchableOpacity onPress={() => setShowMessage(true)}>
                  <Text style={styles.postedBy}>
                    Posted by: {selectedPet.postedBy} ·{" "}
                    <Text style={styles.messageLink}>Message</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.detailsActions}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedPet(null)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
              {selectedPet?.status === "Available" && (
                <TouchableOpacity
                  style={styles.adoptBtn}
                  onPress={() => selectedPet && markAdopted(selectedPet.id)}
                >
                  <Text style={styles.adoptText}>Adopt</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MESSAGE MODAL */}
      <Modal visible={showMessage} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.messageCard}>
            <Text style={styles.formTitle}>
              Message {selectedPet?.postedBy}
            </Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder={`Ask about ${selectedPet?.breed ?? "this pet"}...`}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setShowMessage(false);
                  setMessageText("");
                }}
              >
                <Text style={styles.editText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={sendMessage}>
                <Text style={styles.uploadText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FILL UP / ADD FORM MODAL */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.formCard}>
            <ScrollView>
              <Text style={styles.formTitle}>Fill up</Text>

              <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={32}
                      color="#94a3b8"
                    />
                    <Text style={styles.imageUploadText}>
                      Tap to upload a photo
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Species *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowSpeciesMenu((v) => !v);
                  setShowBreedMenu(false);
                  setShowAgeMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !species && styles.dropdownPlaceholder,
                  ]}
                >
                  {species || "Select species"}
                </Text>
                <Ionicons
                  name={showSpeciesMenu ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#64748b"
                />
              </TouchableOpacity>
              {showSpeciesMenu && (
                <View style={styles.menu}>
                  {SPECIES_OPTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.menuItem}
                      onPress={() => {
                        setSpecies(s);
                        setBreed("");
                        setShowSpeciesMenu(false);
                      }}
                    >
                      <Text style={styles.menuItemText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.fieldLabel}>Breed *</Text>
              <TouchableOpacity
                style={[styles.dropdown, !species && styles.dropdownDisabled]}
                disabled={!species}
                onPress={() => {
                  setShowBreedMenu((v) => !v);
                  setShowSpeciesMenu(false);
                  setShowAgeMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !breed && styles.dropdownPlaceholder,
                  ]}
                >
                  {breed || (species ? "Select breed" : "Select species first")}
                </Text>
                <Ionicons
                  name={showBreedMenu ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#64748b"
                />
              </TouchableOpacity>
              {showBreedMenu && species && (
                <View style={styles.menu}>
                  {BREEDS_BY_SPECIES[species].map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={styles.menuItem}
                      onPress={() => {
                        setBreed(b);
                        setShowBreedMenu(false);
                      }}
                    >
                      <Text style={styles.menuItemText}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.fieldLabel}>Age (optional)</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowAgeMenu((v) => !v);
                  setShowSpeciesMenu(false);
                  setShowBreedMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !age && styles.dropdownPlaceholder,
                  ]}
                >
                  {age || "Select age range"}
                </Text>
                <Ionicons
                  name={showAgeMenu ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#64748b"
                />
              </TouchableOpacity>
              {showAgeMenu && (
                <View style={styles.menu}>
                  {AGE_OPTIONS.map((a) => (
                    <TouchableOpacity
                      key={a}
                      style={styles.menuItem}
                      onPress={() => {
                        setAge(a);
                        setShowAgeMenu(false);
                      }}
                    >
                      <Text style={styles.menuItemText}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.fieldLabel}>Birthday (optional)</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowCalendar(true)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !birthdayDate && styles.dropdownPlaceholder,
                  ]}
                >
                  {birthdayDate ? formatDate(birthdayDate) : "Select date"}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Anti-rabies (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Up to date"
                value={antiRabies}
                onChangeText={setAntiRabies}
              />

              <Text style={styles.fieldLabel}>Core Vaccine (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Complete"
                value={coreVaccine}
                onChangeText={setCoreVaccine}
              />

              <Text style={styles.fieldLabel}>Anti tick & Flea (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Applied"
                value={antiTickFlea}
                onChangeText={setAntiTickFlea}
              />

              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Tell us about this pet"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    (!species || !breed) && styles.uploadBtnDisabled,
                  ]}
                  onPress={uploadPet}
                  disabled={!species || !breed}
                >
                  <Text style={styles.uploadText}>Upload</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    resetForm();
                    setShowAdd(false);
                  }}
                >
                  <Text style={styles.editText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CALENDAR MODAL */}
      <Modal visible={showCalendar} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={20} color="#4c3f91" />
              </TouchableOpacity>
              <Text style={styles.calendarHeaderText}>
                {MONTH_NAMES[calendarView.getMonth()]}{" "}
                {calendarView.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Ionicons name="chevron-forward" size={20} color="#4c3f91" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarWeekRow}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <Text key={i} style={styles.calendarWeekLabel}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarCells.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.calendarCell}
                  disabled={day === null}
                  onPress={() => day && pickDay(day)}
                >
                  {day && <Text style={styles.calendarCellText}>{day}</Text>}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.editText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function badgeColor(status: Pet["status"]) {
  switch (status) {
    case "Available":
      return { backgroundColor: "#bbf7d0" };
    case "Pending":
      return { backgroundColor: "#fef08a" };
    case "Adopted":
      return { backgroundColor: "#e2e8f0" };
  }
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 24,
  },
  heroMobile: {
    flexDirection: "column",
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#4c3f91",
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: 340,
  },
  heroDivider: { height: 2, backgroundColor: "#4c3f91", width: "100%" },
  heroImageBox: {
    width: 260,
    height: 260,
    borderRadius: 16,
    backgroundColor: "#5b4fc4",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardCaption: { fontSize: 11, color: "#475569" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#1e293b" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4c3f91",
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
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
  },
  detailsImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 4,
  },
  detailLine: { fontSize: 13, color: "#1e293b" },
  detailLabel: { color: "#4c3f91", fontWeight: "700" },
  detailDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 6,
    fontStyle: "italic",
  },
  postedBy: { fontSize: 11, color: "#94a3b8", marginTop: 10 },
  messageLink: { color: "#4c3f91", fontWeight: "700" },
  detailsActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  closeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  closeText: { color: "#64748b", fontWeight: "700" },
  adoptBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#16a34a",
  },
  adoptText: { color: "#fff", fontWeight: "700" },

  messageCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    maxHeight: "88%",
  },
  formTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#4c3f91",
    textAlign: "center",
    marginBottom: 14,
  },
  imageUpload: {
    height: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    gap: 4,
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: "100%" },
  imageUploadText: { fontSize: 12, color: "#94a3b8" },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 6,
    marginTop: 4,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  dropdownDisabled: { opacity: 0.5 },
  dropdownText: { fontSize: 13, color: "#1e293b" },
  dropdownPlaceholder: { color: "#94a3b8" },
  menu: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuItemText: { fontSize: 13, color: "#1e293b" },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 13,
  },
  textarea: { height: 80, textAlignVertical: "top" },
  formActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  uploadBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#4c3f91",
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadText: { color: "#fff", fontWeight: "700" },
  editBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  editText: { color: "#64748b", fontWeight: "700" },

  calendarCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 340,
    gap: 4,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarHeaderText: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  calendarWeekRow: { flexDirection: "row", marginBottom: 4 },
  calendarWeekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  calendarCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCellText: { fontSize: 12, color: "#1e293b" },
});
