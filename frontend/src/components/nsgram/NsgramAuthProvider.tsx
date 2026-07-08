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
};

const NsgramAuthContext = createContext<NsgramAuthContextType | undefined>(undefined);

export function NsgramAuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
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

      const userRef = doc(db, "users", user.uid);
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

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
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

  // Connect socket.io client when profile is available
  useEffect(() => {
    if (!profile) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const socketClient = io(backendUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketClient.on("connect", () => {
      console.log("Socket.IO client connected:", socketClient.id);
      socketClient.emit("register", profile.id);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [profile]);

  const logout = async () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    if (!auth) return;
    await signOut(auth);
    router.push("/nsgram");
  };

  return (
    <NsgramAuthContext.Provider value={{ authUser, profile, users, loading, logout, socket }}>
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
