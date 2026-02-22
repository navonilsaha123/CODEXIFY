import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore(app);

// SAVE USER DATA
async function saveUserData(user, name, email) {
  await setDoc(doc(db, "users", user.uid), {
    name: name,
    email: email
  });
}

// FETCH USER DATA
async function loadUserData(user) {
  const docSnap = await getDoc(doc(db, "users", user.uid));
  const data = docSnap.data();
  document.getElementById("welcomeUser").innerText =
    "Hello, " + data.name;
}