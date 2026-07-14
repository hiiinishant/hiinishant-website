"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { auth, db, isConfigured } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

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
  createdAt?: any;
};

type NsgramAuthContextType = {
  authUser: FirebaseUser | null;
  profile: UserProfile | null;
  users: UserProfile[];
  loading: boolean;
  logout: () => Promise<void>;
  socket: any | null;
  socketConnected: boolean;
};

const NsgramAuthContext = createContext<NsgramAuthContextType | undefined>(undefined);

export function NsgramAuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured || !auth || !db) {
      setLoading(false);
      return;
    }

    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db!, "users", user.uid);
      unsubscribeProfile?.();
      unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({ id: snapshot.id, uid: data.uid ?? snapshot.id, ...data } as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    });

    const unsubscribeUsers = onSnapshot(collection(db!, "users"), (snapshot) => {
      const latestUsers = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          uid: docSnap.id,
          ...(docSnap.data() as Omit<UserProfile, "id" | "uid">),
        }))
        .filter((user) => user.isActivated === true) as UserProfile[];
      setUsers(latestUsers);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
      unsubscribeUsers();
    };
  }, []);

  const profileId = profile?.id;

  // Connect socket.io client when profile is available
  useEffect(() => {
    if (!profileId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setSocketConnected(false);
      }
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://hiinishant-backend.onrender.com";
    console.log("Connecting to socket backend:", backendUrl);
    const socketClient = io(backendUrl, {
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

    setSocket(socketClient);

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
