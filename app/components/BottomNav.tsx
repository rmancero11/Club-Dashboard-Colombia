"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useChatStore } from "@/store/chatStore";

export default function BottomNav({
  activeTab,
  onChangeTab,
  onToggleChat,   // ← ya está perfecto
}: any) {

  const totalUnread = useChatStore(state => state.getTotalUnread ());

  const tabs = [
    { key: "perfil", label: "Perfil", icon: "/favicon/iconosclub-15.svg" },
    { key: "destinos", label: "Destinos", icon: "/favicon/iconosclub-16.svg" },
    { key: "descubrir", label: "Descubrir", icon: "/favicon/iconosclub-17.svg" },
    { key: "personas", label: "Personas", icon: "/favicon/iconosclub-18.svg" },
    { key: "chat", label: "Chat", icon: "/favicon/iconosclub-19.svg" },
  ];

  return (
<div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t flex justify-around z-50 h-[70px]">




      {tabs.map((tab) => {
        const isChat = tab.key === "chat";

        return (
          <button
            key={tab.key}
            onClick={() => {
              if (isChat) {
                onToggleChat(); // ← ya manda la acción al padre
              } else {
                onChangeTab(tab.key);
              }
            }}
            className="relative flex flex-col items-center text-sm font-bold text-black font-montserrat"
          >
            <Image
              src={tab.icon}
              alt={tab.label}
              width={36}
              height={36}
              className={
                !isChat && activeTab === tab.key ? "" : "opacity-60"
              }
            />
            {isChat && totalUnread > 0 && (
              <span
                className="absolute top-4 right-10 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
                title={`${totalUnread} mensajes sin leer`}
              >
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
            <span
              className={
                !isChat && activeTab === tab.key
                  ? "text-black"
                  : "text-gray-500"
              }
            >
              {tab.label}
            </span>

            {!isChat && activeTab === tab.key && (
              <motion.div
                layoutId="underline-bottom"
                className="w-5 h-0.5 bg-purple-600 rounded-full mt-1"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
