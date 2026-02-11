import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAyrVNAcnnt42npGMvTHhYzwesfgc3oSl8",
  authDomain: "ff-tournament-5edee.firebaseapp.com",
  databaseURL: "https://ff-tournament-5edee-default-rtdb.firebaseio.com",
  projectId: "ff-tournament-5edee",
  storageBucket: "ff-tournament-5edee.firebasestorage.app",
  messagingSenderId: "980218192086",
  appId: "1:980218192086:web:fc06209af044cfb301e977",
  measurementId: "G-R3XLB1VEJP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
