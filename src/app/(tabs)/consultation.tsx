import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

type Consultation = {
  id: string;
  ownerName: string;
  ownerAge: string;
  ownerGender: string;
  ownerAddress: string;
  petName: string;
  petAge: string;
  petGender: string;
  petSpecies: string;
  petBreed: string;
  scheduledDate: string;
  scheduledTime: string;
  concern: string;
  status: "Scheduled" | "Ongoing" | "Completed";
  accepted: boolean; // staff must accept before the consultation can start
  vetJoined: boolean;
};

const SAMPLE_CONSULTS: Consultation[] = [
  {
    id: "CN-001",
    ownerName: "Maria Santos",
    ownerAge: "34",
    ownerGender: "Female",
    ownerAddress: "Angeles City",
    petName: "Choco",
    petAge: "3 yrs",
    petGender: "Male",
    petSpecies: "Dog",
    petBreed: "Aspin",
    scheduledDate: "Sep 26, 2026",
    scheduledTime: "2:00 PM",
    concern: "Loss of appetite for 2 days",
    status: "Scheduled",
    accepted: false,
    vetJoined: false,
  },
  {
    id: "CN-002",
    ownerName: "John Cruz",
    ownerAge: "28",
    ownerGender: "Male",
    ownerAddress: "Mabalacat City",
    petName: "Buddy",
    petAge: "1 yr",
    petGender: "Male",
    petSpecies: "Dog",
    petBreed: "Shih Tzu",
    scheduledDate: "Sep 25, 2026",
    scheduledTime: "4:30 PM",
    concern: "Follow-up after vaccination",
    status: "Ongoing",
    accepted: true,
    vetJoined: true,
  },
  {
    id: "CN-003",
    ownerName: "Ella Ramos",
    ownerAge: "41",
    ownerGender: "Female",
    ownerAddress: "San Fernando",
    petName: "Kitkat",
    petAge: "2 yrs",
    petGender: "Female",
    petSpecies: "Cat",
    petBreed: "Persian",
    scheduledDate: "Sep 22, 2026",
    scheduledTime: "10:00 AM",
    concern: "Skin irritation check",
    status: "Completed",
    accepted: true,
    vetJoined: true,
  },
];

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];
const SPECIES_OPTIONS = ["Dog", "Cat"];
const PET_GENDER_OPTIONS = ["Male", "Female"];
const PET_AGE_OPTIONS = [
  "Below 6 months (Puppy/Kitten)",
  "6 months - 1 yr (Young)",
  "1 yr (Young Adult)",
  "2 yrs (Adult)",
  "3 yrs (Adult)",
  "4 yrs (Adult)",
  "5 yrs (Adult)",
  "6-8 yrs (Mature)",
  "9-10 yrs (Senior)",
  "Above 10 yrs (Senior)",
];
const BREEDS_BY_SPECIES: Record<string, string[]> = {
  Dog: [
    "Aspin",
    "Shih Tzu",
    "Chihuahua",
    "Poodle",
    "Labrador",
    "Golden Retriever",
    "Beagle",
    "Pomeranian",
    "German Shepherd",
    "Mixed Breed",
  ],
  Cat: [
    "Puspin",
    "Persian",
    "Siamese",
    "British Shorthair",
    "Maine Coon",
    "Ragdoll",
    "Scottish Fold",
    "Bengal",
    "Mixed Breed",
  ],
};

// Simple date/time slot generators for a tap-to-pick list
const UPCOMING_DATES = Array.from({ length: 10 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
});
const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

// --- VIDEO CALL --------------------------------------------------------
// Peer-to-peer video (WebRTC via the free public PeerJS signaling server).
// No backend, no account, no login screen.
//
//  * STAFF starts the meeting -> opens the room straight away as the host.
//    Nobody has to approve the staff.
//  * CLIENT joins -> waits until the staff has started, then sends a join
//    request. The staff sees "<name> wants to join" with Admit / Deny.
//    The video only connects after the staff taps Admit.
//
// Both sides derive the same room id from the consultation id.
const PEERJS_SRC = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";

// Safe to embed a value inside an inline <script>
const js = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

function buildCallHtml(
  role: "client" | "staff",
  consultId: string,
  displayName: string,
  micOn: boolean,
  camOn: boolean,
) {
  const roomKey = `seraphvet-angeles-${consultId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;background:#000;color:#fff;overflow:hidden;
    font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
  #remote{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#111}
  #local{position:absolute;right:12px;top:12px;width:110px;height:150px;object-fit:cover;
    border-radius:10px;border:1px solid #555;background:#222;transform:scaleX(-1);z-index:3}
  #status{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;
    align-items:center;justify-content:center;text-align:center;padding:24px;gap:10px;background:#141414}
  #status.hidden{display:none}
  #remoteAv{position:absolute;inset:0;z-index:1;display:none;flex-direction:column;
    align-items:center;justify-content:center;gap:12px;background:#202124}
  #remoteAv .c{width:110px;height:110px;border-radius:50%;display:flex;align-items:center;
    justify-content:center;font-size:40px;font-weight:800;background:#1e3a8a}
  #remoteAv .n{font-size:14px;color:#9ca3af}
  #localAv{position:absolute;right:12px;top:12px;width:110px;height:150px;border-radius:10px;
    border:1px solid #555;background:#3c4043;z-index:3;display:none;align-items:center;
    justify-content:center;font-size:28px;font-weight:800}
  #title{font-size:20px;font-weight:700}
  #sub{font-size:14px;color:#9ca3af;max-width:320px;line-height:1.4}
  .spin{width:34px;height:34px;border-radius:50%;border:3px solid #333;border-top-color:#fff;
    animation:s 1s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
  #req{position:absolute;left:12px;right:12px;bottom:76px;z-index:5;display:none;
    background:#303134;border-radius:14px;padding:14px;gap:12px;align-items:center;
    box-shadow:0 6px 24px rgba(0,0,0,.5)}
  #req span{flex:1;font-size:14px;font-weight:600}
  button{border:0;border-radius:20px;padding:10px 18px;font-weight:700;font-size:13px;color:#fff;cursor:pointer}
  #admit{background:#1a73e8} #deny{background:#5f6368}
  #bar{position:absolute;left:0;right:0;bottom:12px;z-index:4;display:flex;justify-content:center;gap:12px}
  #bar button{background:#3c4043;min-width:64px}
  #bar button.off{background:#ea4335}
</style>
</head><body>
<video id="remote" autoplay playsinline></video>
<video id="local" autoplay playsinline muted></video>
<div id="remoteAv"><div class="c" id="remoteAvC">?</div><div class="n" id="remoteAvN"></div></div>
<div id="localAv">You</div>
<div id="status"><div class="spin" id="spin"></div><div id="title">Starting…</div><div id="sub"></div></div>
<div id="req"><span id="reqText"></span><button id="deny">Deny</button><button id="admit">Admit</button></div>
<div id="bar"><button id="micBtn">Mic</button><button id="camBtn">Cam</button></div>
<script src="${PEERJS_SRC}"></script>
<script>
(function () {
  var ROLE = ${js(role)};
  var NAME = ${js(displayName)};
  var HOST_ID = ${js(roomKey + "-host")};
  var MIC_ON = ${micOn ? "true" : "false"};
  var CAM_ON = ${camOn ? "true" : "false"};

  var $ = function (id) { return document.getElementById(id); };
  var remote = $("remote"), local = $("local");
  var localStream = null, peer = null, approved = {}, ended = false;
  var dataConn = null, remoteName = "";

  function ini(n) {
    var p = (n || "?").split(" ").filter(Boolean);
    if (!p.length) return "?";
    return ((p[0][0] || "?") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function camIsOn() {
    if (!localStream) return false;
    var t = localStream.getVideoTracks();
    return t.length > 0 && t[0].enabled;
  }
  function updateLocalAv() {
    $("localAv").style.display = camIsOn() ? "none" : "flex";
  }
  function sendState() {
    if (dataConn && dataConn.open) {
      dataConn.send({ type: "state", cam: camIsOn(), name: NAME });
    }
  }
  function remoteState(d) {
    if (d.name) remoteName = d.name;
    $("remoteAvC").textContent = ini(remoteName);
    $("remoteAvN").textContent = remoteName;
    $("remoteAv").style.display = d.cam ? "none" : "flex";
  }

  function setStatus(title, sub, spin) {
    $("title").textContent = title;
    $("sub").textContent = sub || "";
    $("spin").style.display = spin === false ? "none" : "block";
    $("status").className = "";
  }
  function hideStatus() { $("status").className = "hidden"; }

  function attach(call) {
    call.on("stream", function (stream) {
      remote.srcObject = stream;
      sendState();
      var pl = remote.play(); if (pl && pl.catch) pl.catch(function () {});
      hideStatus();
    });
    call.on("close", function () {
      remote.srcObject = null;
      if (!ended) setStatus(ROLE === "staff" ? "Client left the call" : "The vet left the call",
        ROLE === "staff" ? "Waiting for the client to join again…" : "", false);
    });
  }

  function getMedia() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.resolve(null);
    }
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .catch(function () {
        return navigator.mediaDevices.getUserMedia({ audio: true }).catch(function () { return null; });
      })
      .then(function (st) {
        if (st) {
          st.getAudioTracks().forEach(function (t) { t.enabled = MIC_ON; });
          st.getVideoTracks().forEach(function (t) { t.enabled = CAM_ON; });
          local.srcObject = st;
        }
        return st;
      });
  }

  function toggle(kind, btn) {
    if (!localStream) return;
    var tracks = kind === "mic" ? localStream.getAudioTracks() : localStream.getVideoTracks();
    var on = tracks.length ? !tracks[0].enabled : false;
    tracks.forEach(function (t) { t.enabled = on; });
    btn.className = on ? "" : "off";
    updateLocalAv();
    sendState();
  }

  function startHost() {
    setStatus("Starting meeting…", "", true);
    peer = new Peer(HOST_ID);
    peer.on("open", function () {
      setStatus("Meeting started", "Waiting for the client to ask to join…", true);
    });
    peer.on("error", function (e) {
      if (e.type === "unavailable-id") {
        setStatus("Meeting already open", "This consultation is already open in another tab or device. Close it there first, then try again.", false);
      } else {
        setStatus("Connection problem", "(" + e.type + ") Check your internet and try again.", false);
      }
    });
    // A client is knocking: ask the staff to admit or deny.
    peer.on("connection", function (conn) {
      conn.on("data", function (d) {
        if (d && d.type === "state") { remoteState(d); return; }
        if (!d || d.type !== "knock") return;
        dataConn = conn;
        remoteName = d.name || "Client";
        $("reqText").textContent = (d.name || "A client") + " wants to join";
        $("req").style.display = "flex";
        $("admit").onclick = function () {
          approved[conn.peer] = true;
          $("req").style.display = "none";
          conn.send({ type: "approved" });
          sendState();
        };
        $("deny").onclick = function () {
          $("req").style.display = "none";
          conn.send({ type: "denied" });
        };
      });
      conn.on("close", function () { $("req").style.display = "none"; });
    });
    // Only answer calls from people the staff has admitted.
    peer.on("call", function (call) {
      if (!approved[call.peer]) { call.close(); return; }
      call.answer(localStream || undefined);
      attach(call);
    });
  }

  function startClient() {
    peer = new Peer();
    peer.on("open", knock);
    peer.on("error", function (e) {
      if (e.type === "peer-unavailable") {
        // Staff has not started yet: keep waiting and retry.
        setStatus("Waiting for the vet to start", "You will be able to ask to join as soon as the vet starts the meeting.", true);
        setTimeout(knock, 2500);
      } else {
        setStatus("Connection problem", "(" + e.type + ") Check your internet and try again.", false);
      }
    });
  }

  function knock() {
    if (ended || !peer || peer.destroyed) return;
    var conn = peer.connect(HOST_ID, { reliable: true });
    conn.on("open", function () {
      dataConn = conn;
      remoteName = "Vet (Staff)";
      conn.send({ type: "knock", name: NAME });
      setStatus("Asking to join…", "Waiting for the vet to let you in.", true);
    });
    conn.on("data", function (d) {
      if (!d) return;
      if (d.type === "state") { remoteState(d); return; }
      if (d.type === "approved") {
        setStatus("Connecting…", "", true);
        attach(peer.call(HOST_ID, localStream || undefined));
      } else if (d.type === "denied") {
        setStatus("Request declined", "The vet did not admit you to this meeting.", false);
      }
    });
  }

  $("micBtn").onclick = function () { toggle("mic", $("micBtn")); };
  $("camBtn").onclick = function () { toggle("cam", $("camBtn")); };
  if (!MIC_ON) $("micBtn").className = "off";
  if (!CAM_ON) $("camBtn").className = "off";
  document.addEventListener("click", function () {
    if (remote.srcObject) { var pl = remote.play(); if (pl && pl.catch) pl.catch(function () {}); }
  });
  window.addEventListener("beforeunload", function () { ended = true; if (peer) peer.destroy(); });

  if (typeof Peer === "undefined") {
    setStatus("Could not load video", "Check your internet connection.", false);
    return;
  }
  getMedia().then(function (st) {
    localStream = st;
    updateLocalAv();
    if (ROLE === "staff") startHost(); else startClient();
  });
})();
</script>
</body></html>`;
}

const AVATAR_COLORS = [
  "#1e3a8a",
  "#0f766e",
  "#7c3aed",
  "#b45309",
  "#be123c",
  "#0369a1",
  "#4d7c0f",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function InitialsAvatar({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <View
      style={[
        styles.initialsAvatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getAvatarColor(name),
        },
      ]}
    >
      <Text style={[styles.initialsText, { fontSize: size * 0.36 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

// Reusable tap-to-select field: looks like a text input, opens a modal list
function SelectField({
  label,
  value,
  options,
  onSelect,
  placeholder,
  disabled,
}: {
  label?: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[
          styles.input,
          styles.selectInput,
          disabled && styles.selectDisabled,
        ]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <Text style={value ? styles.selectValue : styles.selectPlaceholder}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={open} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.pickerCard}>
            {label ? <Text style={styles.pickerTitle}>{label}</Text> : null}
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
                    <Ionicons name="checkmark" size={18} color="#1e3a8a" />
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

export default function ConsultationScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width <= 600;
  const [items, setItems] = useState<Consultation[]>(SAMPLE_CONSULTS);
  const [showForm, setShowForm] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [activeConsult, setActiveConsult] = useState<Consultation | null>(null);
  const [role, setRole] = useState<"client" | "staff">("client");

  const [ownerName, setOwnerName] = useState("");
  const [ownerAge, setOwnerAge] = useState("");
  const [ownerGender, setOwnerGender] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");

  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petGender, setPetGender] = useState("");
  const [petBreed, setPetBreed] = useState("");

  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [concern, setConcern] = useState("");

  const availableBreeds = useMemo(
    () => (petSpecies ? (BREEDS_BY_SPECIES[petSpecies] ?? []) : []),
    [petSpecies],
  );

  // Meeting controls
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [inLobby, setInLobby] = useState(true); // true = pre-join screen, false = joined meeting

  const resetForm = () => {
    setOwnerName("");
    setOwnerAge("");
    setOwnerGender("");
    setOwnerAddress("");
    setPetName("");
    setPetSpecies("");
    setPetAge("");
    setPetGender("");
    setPetBreed("");
    setScheduledDate("");
    setScheduledTime("");
    setConcern("");
  };

  const submitForm = () => {
    if (!ownerName || !petName) return;
    const newItem: Consultation = {
      id: `CN-${String(items.length + 1).padStart(3, "0")}`,
      ownerName,
      ownerAge,
      ownerGender,
      ownerAddress,
      petName,
      petAge,
      petGender,
      petSpecies,
      petBreed,
      scheduledDate: scheduledDate || "TBD",
      scheduledTime: scheduledTime || "",
      concern,
      status: "Scheduled",
      accepted: false,
      vetJoined: false,
    };
    setItems((prev) => [newItem, ...prev]);
    resetForm();
    setShowForm(false);
  };

  const acceptConsult = (id: string) => {
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, accepted: true } : c)),
    );
  };

  const startMeeting = async (item: Consultation) => {
    // Client can only go in after staff has started the meeting
    if (role === "client" && !item.vetJoined) return;
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    if (!micPermission?.granted) {
      const res = await requestMicPermission();
      if (!res.granted) return;
    }
    setActiveConsult(item);
    setCamOn(true);
    setMicOn(true);
    setInLobby(true); // always land in the lobby first, not straight into the call
    setShowMeeting(true);
  };

  const joinMeeting = () => {
    if (activeConsult) {
      setItems((prev) =>
        prev.map((c) =>
          c.id === activeConsult.id
            ? {
                ...c,
                status: "Ongoing",
                vetJoined: role === "staff" ? true : c.vetJoined,
              }
            : c,
        ),
      );
      setActiveConsult((prev) =>
        prev
          ? {
              ...prev,
              status: "Ongoing",
              vetJoined: role === "staff" ? true : prev.vetJoined,
            }
          : prev,
      );
    }
    setInLobby(false);
  };

  // Cancel / leave the lobby: close the screen but DO NOT change the status.
  const closeMeeting = () => {
    setShowMeeting(false);
    setActiveConsult(null);
    setInLobby(true);
  };

  // End call: only used from inside the call. This marks it Completed.
  const endMeeting = () => {
    // Only staff (the moderator) ends the consultation. A client leaving
    // just closes the screen and can rejoin while it is still ongoing.
    if (role === "staff" && activeConsult) {
      setItems((prev) =>
        prev.map((c) =>
          c.id === activeConsult.id ? { ...c, status: "Completed" } : c,
        ),
      );
    }
    setShowMeeting(false);
    setActiveConsult(null);
    setInLobby(true);
  };

  const callHtml = activeConsult
    ? buildCallHtml(
        role,
        activeConsult.id,
        role === "staff" ? "Vet (Staff)" : activeConsult.ownerName,
        micOn,
        camOn,
      )
    : "";

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.pageTitle}>CONSULTATION VIRTUAL</Text>

      <View style={styles.roleSwitcher}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "client" && styles.roleBtnActive]}
          onPress={() => setRole("client")}
        >
          <Text
            style={[
              styles.roleBtnText,
              role === "client" && styles.roleBtnTextActive,
            ]}
          >
            Client
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === "staff" && styles.roleBtnActive]}
          onPress={() => setRole("staff")}
        >
          <Text
            style={[
              styles.roleBtnText,
              role === "staff" && styles.roleBtnTextActive,
            ]}
          >
            Staff
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const actionBtn =
            role === "staff" &&
            !item.accepted &&
            item.status !== "Completed" ? (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => acceptConsult(item.id)}
              >
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            ) : item.accepted && item.status !== "Completed" ? (
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  role === "client" &&
                    !item.vetJoined &&
                    styles.startBtnDisabled,
                ]}
                disabled={role === "client" && !item.vetJoined}
                onPress={() => startMeeting(item)}
              >
                <Text style={styles.startText}>
                  {role === "staff"
                    ? item.status === "Ongoing"
                      ? "Rejoin Meeting"
                      : "Start Meeting"
                    : item.vetJoined
                      ? "Join Meeting"
                      : "Waiting for staff"}
                </Text>
              </TouchableOpacity>
            ) : null;

          if (isMobile) {
            return (
              <View style={styles.rowMobile}>
                <View style={styles.rowMobileTop}>
                  <InitialsAvatar name={item.ownerName} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.consultId}>{item.id}</Text>
                    <Text style={styles.userInfo}>
                      {item.ownerName} · {item.petName}
                    </Text>
                  </View>
                  <View style={styles.timeColMobile}>
                    <Text style={styles.time}>{item.scheduledTime}</Text>
                    <Text style={styles.date}>{item.scheduledDate}</Text>
                  </View>
                </View>
                {!item.accepted && item.status !== "Completed" && (
                  <Text style={styles.pendingNote}>
                    Awaiting staff confirmation
                  </Text>
                )}
                <View style={styles.rowMobileBottom}>
                  <View style={[styles.statusBadge, badgeColor(item.status)]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                  {actionBtn}
                </View>
              </View>
            );
          }

          return (
            <View style={styles.row}>
              <InitialsAvatar name={item.ownerName} size={48} />
              <View style={styles.divider} />
              <View style={{ flex: 1 }}>
                <Text style={styles.consultId}>{item.id}</Text>
                <Text style={styles.userInfo}>
                  {item.ownerName} · {item.petName}
                </Text>
                {!item.accepted && item.status !== "Completed" && (
                  <Text style={styles.pendingNote}>
                    Awaiting staff confirmation
                  </Text>
                )}
              </View>
              <View style={styles.divider} />
              <View style={styles.centerCol}>
                <View style={[styles.statusBadge, badgeColor(item.status)]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                {actionBtn}
              </View>
              <View style={styles.divider} />
              <View style={styles.timeCol}>
                <Text style={styles.time}>{item.scheduledTime}</Text>
                <Text style={styles.date}>{item.scheduledDate}</Text>
              </View>
            </View>
          );
        }}
      />

      {role === "client" && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {/* INFORMATION FORM MODAL */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>INFORMATION FORM</Text>

              <View style={styles.formColumns}>
                <View style={styles.formCol}>
                  <Text style={styles.formColTitle}>OWNER INFORMATION</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Full name"
                    value={ownerName}
                    onChangeText={setOwnerName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Age"
                    value={ownerAge}
                    onChangeText={setOwnerAge}
                    keyboardType="numeric"
                  />
                  <SelectField
                    label="Gender"
                    value={ownerGender}
                    options={GENDER_OPTIONS}
                    onSelect={setOwnerGender}
                    placeholder="Select gender"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Address"
                    value={ownerAddress}
                    onChangeText={setOwnerAddress}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.formColTitle}>PET INFORMATION</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Pet name"
                    value={petName}
                    onChangeText={setPetName}
                  />
                  <SelectField
                    label="Species"
                    value={petSpecies}
                    options={SPECIES_OPTIONS}
                    onSelect={(v) => {
                      setPetSpecies(v);
                      setPetBreed("");
                    }}
                    placeholder="Select species"
                  />
                  <SelectField
                    label="Age"
                    value={petAge}
                    options={PET_AGE_OPTIONS}
                    onSelect={setPetAge}
                    placeholder="Select age"
                  />
                  <SelectField
                    label="Gender"
                    value={petGender}
                    options={PET_GENDER_OPTIONS}
                    onSelect={setPetGender}
                    placeholder="Select gender"
                  />
                  <SelectField
                    label="Breed"
                    value={petBreed}
                    options={availableBreeds}
                    onSelect={setPetBreed}
                    placeholder={
                      petSpecies ? "Select breed" : "Select species first"
                    }
                    disabled={!petSpecies}
                  />
                </View>
              </View>

              <View style={styles.formDivider} />

              <View style={styles.dateTimeRow}>
                <View style={{ flex: 1 }}>
                  <SelectField
                    label="Consultation date"
                    value={scheduledDate}
                    options={UPCOMING_DATES}
                    onSelect={setScheduledDate}
                    placeholder="Pick a date"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <SelectField
                    label="Consultation time"
                    value={scheduledTime}
                    options={TIME_SLOTS}
                    onSelect={setScheduledTime}
                    placeholder="Pick a time"
                  />
                </View>
              </View>

              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: "top" }]}
                placeholder="Concern"
                value={concern}
                onChangeText={setConcern}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowForm(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={submitForm}>
                  <Text style={styles.saveText}>SUBMIT</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MEETING MODAL — Google Meet style */}
      <Modal visible={showMeeting} animationType="fade">
        <View style={styles.meetingContainer}>
          <Text style={styles.pageTitle}>CONSULTATION VIRTUAL</Text>
          <Text style={styles.meetingLabel}>
            {inLobby
              ? role === "staff"
                ? "READY TO START?"
                : "READY TO JOIN?"
              : "MEETING CONSULTATION"}{" "}
            {activeConsult ? `· ${activeConsult.id}` : ""}
          </Text>

          <View style={styles.meetingStage}>
            {inLobby ? (
              <View style={styles.mainVideo}>
                {camOn && permission?.granted ? (
                  <CameraView style={StyleSheet.absoluteFill} facing={facing} />
                ) : (
                  <View style={styles.camOffBox}>
                    <Ionicons name="person-circle" size={120} color="#d1d5db" />
                    <Text style={styles.camOffText}>Camera is off</Text>
                  </View>
                )}
                <View style={styles.selfLabel}>
                  <Text style={styles.selfLabelText}>You</Text>
                </View>
              </View>
            ) : (
              <View style={styles.callBox}>
                {Platform.OS === "web" ? (
                  // @ts-ignore -- iframe is valid on web only
                  <iframe
                    srcDoc={callHtml}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                ) : (
                  <WebView
                    source={{ html: callHtml, baseUrl: "https://localhost" }}
                    style={{ flex: 1 }}
                    originWhitelist={["*"]}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    mediaCapturePermissionGrantType="grant"
                  />
                )}
              </View>
            )}
          </View>

          {inLobby ? (
            <View style={styles.lobbyBar}>
              <View style={styles.lobbyToggles}>
                <TouchableOpacity
                  style={[styles.controlBtn, !micOn && styles.controlBtnOff]}
                  onPress={() => setMicOn((m) => !m)}
                >
                  <Ionicons
                    name={micOn ? "mic" : "mic-off"}
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlBtn, !camOn && styles.controlBtnOff]}
                  onPress={() => setCamOn((c) => !c)}
                >
                  <Ionicons
                    name={camOn ? "videocam" : "videocam-off"}
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() =>
                    setFacing((f) => (f === "front" ? "back" : "front"))
                  }
                >
                  <Ionicons name="camera-reverse" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.joinBtn} onPress={joinMeeting}>
                <Text style={styles.joinBtnText}>
                  {role === "staff" ? "Start meeting" : "Ask to join"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeMeeting}>
                <Text style={styles.cancelJoinText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.controlBar}>
              <TouchableOpacity style={styles.endCallBtn} onPress={endMeeting}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.endCallText}>
                  {role === "staff" ? "End call" : "Leave"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

function badgeColor(status: Consultation["status"]) {
  switch (status) {
    case "Scheduled":
      return { backgroundColor: "#dbeafe" };
    case "Ongoing":
      return { backgroundColor: "#fef9c3" };
    case "Completed":
      return { backgroundColor: "#dcfce7" };
  }
}

const styles = StyleSheet.create({
  roleSwitcher: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
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
  pageTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { width: 1, height: 40, backgroundColor: "#cbd5e1" },
  rowMobile: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  rowMobileTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowMobileBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  timeColMobile: { alignItems: "flex-end" },
  consultId: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 2,
  },
  userInfo: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  centerCol: { alignItems: "center", gap: 6, paddingHorizontal: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700", color: "#1e293b" },
  startBtn: {
    backgroundColor: "#1e3a8a",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  startBtnDisabled: { backgroundColor: "#94a3b8" },
  startText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  acceptBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  acceptText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  pendingNote: {
    fontSize: 10,
    color: "#b45309",
    marginTop: 2,
    fontStyle: "italic",
  },
  timeCol: { alignItems: "center", minWidth: 70 },
  time: { fontSize: 12, fontWeight: "700", color: "#1e293b" },
  date: { fontSize: 10, color: "#94a3b8" },
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
    fontSize: 17,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 16,
    textAlign: "center",
  },
  formColumns: { flexDirection: "row", gap: 12 },
  formCol: { flex: 1 },
  formColTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
  },
  formDivider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 13,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectDisabled: { backgroundColor: "#f1f5f9" },
  selectValue: { fontSize: 13, color: "#1e293b" },
  selectPlaceholder: { fontSize: 13, color: "#94a3b8" },
  dateTimeRow: { flexDirection: "row", gap: 10 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
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
    padding: 16,
    width: "100%",
    maxWidth: 340,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  pickerRowText: { fontSize: 14, color: "#1e293b" },

  meetingContainer: { flex: 1, backgroundColor: "#202124" },
  meetingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    padding: 16,
    paddingBottom: 0,
    backgroundColor: "transparent",
  },
  meetingStage: { flex: 1, margin: 16, borderRadius: 12, overflow: "hidden" },
  mainVideo: {
    flex: 1,
    backgroundColor: "#3c4043",
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  camOffBox: { alignItems: "center", justifyContent: "center", gap: 8 },
  camOffText: { color: "#9ca3af", fontSize: 12 },
  selfLabel: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  selfLabelText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  initialsAvatar: { alignItems: "center", justifyContent: "center" },
  initialsText: { color: "#fff", fontWeight: "800" },
  pipBox: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#3c4043",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#555",
  },
  pipLabel: { color: "#9ca3af", fontSize: 10 },

  controlBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 18,
    backgroundColor: "#202124",
  },
  lobbyBar: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 18,
    backgroundColor: "#202124",
  },
  lobbyToggles: { flexDirection: "row", gap: 16 },
  joinBtn: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  joinBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cancelJoinText: { color: "#9ca3af", fontSize: 12 },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3c4043",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnOff: { backgroundColor: "#ea4335" },
  callBox: {
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
  },
  endCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: "#ea4335",
  },
  endCallText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  endBtn: {
    width: 56,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ea4335",
    alignItems: "center",
    justifyContent: "center",
  },
});
