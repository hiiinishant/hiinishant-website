"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { auth, db, isConfigured } from "@/lib/firebase";
import { API_BASE } from "@/lib/api";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

export type AvatarType = "boy" | "girl";

export type UserProfile = {
  id: string;
  uid: string;
  displayName: string;
  username: string;
  email: string;
  bio: string;
  avatar: AvatarType;
  role: "admin" | "user";
  isActivated?: boolean;
  createdAt?: unknown;
};

type NsgramAuthContextType = {
  authUser: FirebaseUser | null;
  profile: UserProfile | null;
  users: UserProfile[];
  loading: boolean;
  logout: () => Promise<void>;
  socket: Socket | null;
  socketConnected: boolean;
};

const NsgramAuthContext = createContext<NsgramAuthContextType | undefined>(undefined);

export function NsgramAuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured || !auth || !db) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    let unsubscribeProfile: (() => void) | undefined;
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) {
        setProfile(null);
        clearTimeout(safetyTimer);
        setLoading(false);
        return;
      }

      const userRef = doc(db!, "users", user.uid);
      unsubscribeProfile?.();
      unsubscribeProfile = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Partial<UserProfile>;
            setProfile({ id: snapshot.id, uid: (data.uid as string) ?? snapshot.id, ...(data as object) } as UserProfile);
          } else {
            setProfile(null);
          }
          clearTimeout(safetyTimer);
          queueMicrotask(() => setLoading(false));
        },
        (error) => {
          if (error.code === "permission-denied") {
            console.warn("Profile snapshot permission pending or denied:", error.message);
          } else {
            console.error("Error listening to profile snapshot:", error);
          }
          setProfile(null);
          clearTimeout(safetyTimer);
          queueMicrotask(() => setLoading(false));
        }
      );
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  // Listen to users collection only after the user is authenticated, email verified, and profile activated.
  // This prevents Permission Denied errors for guests or unverified users.
  useEffect(() => {
    if (!db || !authUser || !authUser.emailVerified || !profile || !profile.isActivated) {
      queueMicrotask(() => setUsers([]));
      return;
    }

    let isCancelled = false;
    let unsubscribeUsers: (() => void) | undefined;

    // Refresh auth ID token to make sure email_verified claim is updated in Firebase Auth for Firestore security rules
    authUser.getIdToken(true).then(() => {
      if (isCancelled || !db) return;

      unsubscribeUsers = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          const latestUsers = snapshot.docs
            .map((docSnap) => ({
              id: docSnap.id,
              uid: docSnap.id,
              ...(docSnap.data() as Omit<UserProfile, "id" | "uid">),
            }))
            .filter((user) => user.isActivated === true) as UserProfile[];
          setUsers(latestUsers);
        },
        (error) => {
          if (error.code === "permission-denied") {
            console.warn("Users collection read permission pending or denied:", error.message);
          } else {
            console.error("Error listening to users collection:", error);
          }
          setUsers([]);
        }
      );
    }).catch((err) => {
      console.warn("Failed to refresh ID token before users listener:", err);
    });

    return () => {
      isCancelled = true;
      unsubscribeUsers?.();
    };
  }, [authUser, authUser?.emailVerified, profile, profile?.isActivated]);

  const profileId = profile?.id;

  // Connect socket.io client when profile is available
  useEffect(() => {
    if (!profileId) {
      if (socket) {
        socket.disconnect();
        queueMicrotask(() => setSocket(null));
        queueMicrotask(() => setSocketConnected(false));
      }
      return;
    }

    const backendUrl = API_BASE;
    console.log("Connecting to socket backend:", backendUrl || "same origin");
    const socketClient = io(backendUrl || undefined, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketClient.on("connect", () => {
      console.log("Socket.IO client connected:", socketClient.id);
      socketClient.emit("register", profileId);
      setSocketConnected(true);
    });

    socketClient.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      setSocketConnected(false);
    });

    socketClient.on("disconnect", (reason) => {
      console.log("Socket.IO client disconnected:", reason);
      setSocketConnected(false);
    });

    socketClient.on("reconnect", () => {
      console.log("Socket.IO client reconnected:", socketClient.id);
      socketClient.emit("register", profileId);
      setSocketConnected(true);
    });

    queueMicrotask(() => setSocket(socketClient));

    return () => {
      socketClient.disconnect();
      setSocketConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const logout = async () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setSocketConnected(false);
    }
    if (!auth) return;
    await signOut(auth);
    router.push("/nsgram");
  };

  return (
    <NsgramAuthContext.Provider value={{ authUser, profile, users, loading, logout, socket, socketConnected }}>
      {children}
    </NsgramAuthContext.Provider>
  );
}

export function useNsgramAuth() {
  const context = useContext(NsgramAuthContext);
  if (!context) {
    throw new Error("useNsgramAuth must be used within an NsgramAuthProvider");
  }
  return context;
}
