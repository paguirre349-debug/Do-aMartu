"use client";
import dynamic from "next/dynamic";
import "./globals.css";

// El sistema usa APIs del navegador (FileReader, teclado), así que lo cargamos solo en cliente.
const Sistema = dynamic(() => import("@/components/Sistema"), { ssr: false });

export default function Home() {
  return <Sistema />;
}
