"use client";
import React, { createContext, useContext, ReactNode } from "react";

interface LangCtx { language: 'en'; setLanguage: (l: 'en') => void; }
const LangContext = createContext<LangCtx>({ language:'en', setLanguage:()=>{} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  return <LangContext.Provider value={{ language:'en', setLanguage:()=>{} }}>{children}</LangContext.Provider>;
}
export function useLanguage() { return useContext(LangContext); }
