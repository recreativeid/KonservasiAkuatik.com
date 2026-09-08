"use client";
import React from "react";
import { ContainerScroll } from "./container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden pb-[500px] pt-[1000px]">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              Belajar Berenang Lebih Cepat, <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                Percaya Diri & Menyenangkan
              </span>
            </h1>
          </>
        }
      >
        <video
          src="https://kvvhxytklcxvculklnqr.supabase.co/storage/v1/object/public/konservasiaquatic/WhatsApp%20Video%202026-09-07%20at%2021.46.24.webm"
          autoPlay
          muted
          loop
          playsInline
          className="mx-auto rounded-2xl object-cover h-full w-full object-center"
        />
      </ContainerScroll>
    </div>
  );
}
