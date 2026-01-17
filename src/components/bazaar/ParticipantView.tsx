"use client";
import React from "react";
import Link from "next/link";
// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function ParticipantView({ team, meta }: { team: any, meta: any }) {
    // If no team, show "Register Now" CTA
    if (!team) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto">
                 <InformationSection meta={meta} />
                 
                 <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow">
                     <h2 className="text-2xl font-bold mb-4">Welcome to Bazaar System!</h2>
                     <p className="text-gray-500 mb-8 max-w-md mx-auto">You have not registered a team yet. Please create a team to participate.</p>
                     <Link href="/register" className="inline-block px-8 py-4 bg-brand-500 text-white font-bold rounded-lg hover:bg-brand-600 transition shadow-lg hover:shadow-xl">
                         Register Now
                     </Link>
                 </div>
            </div>
        );
    }

    const isPaid = team && (team.paymentStatus === 'PAID' || team.paymentStatus === 'VERIFIED');

    // If team exists but not paid, redirect or show message
    if (!isPaid) {
         return (
            <div className="space-y-8 max-w-7xl mx-auto">
                 <InformationSection meta={meta} />
                 
                 <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow">
                     <h2 className="text-2xl font-bold mb-4 text-orange-500">Registration Incomplete</h2>
                     <p className="text-gray-500 mb-8">Your team <strong>{team.name}</strong> has not completed payment.</p>
                     <p className="mb-4">Please complete your payment to unlock the dashboard.</p>
                     <Link href="/register" className="inline-block px-8 py-4 bg-brand-500 text-white font-bold rounded-lg hover:bg-brand-600 transition">
                         Complete Payment
                     </Link>
                 </div>
            </div>
         );
    }

    // Default Dashboard for Paid Participants
    return (
        <div className="space-y-8 max-w-7xl mx-auto">
             <WelcomeSection team={team} meta={meta} />
             <InformationSection meta={meta} />
             <DashboardSection team={team} meta={meta} />
        </div>
    );
}

// ----------------------------------------------------------------------
// WELCOME SECTION 
// ----------------------------------------------------------------------
function WelcomeSection({ team, meta }: { team: any, meta: any }) {
    if (!team) return null;
    return (
        <div className="bg-green-500 text-white p-6 rounded-lg shadow">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div>
                        <h2 className="text-2xl font-bold">Welcome, {team.name || team.leaderName}!</h2>
                        <p className="opacity-90">Status: <span className="font-bold uppercase">{team.paymentStatus}</span></p>
                        <p className="mt-2 text-sm bg-white/20 p-2 rounded inline-block">
                        Booth: {meta?.booths?.find((b:any) => b.id === team.boothLocationId)?.name || team.boothLocationId || "Not Selected"} | 
                        Ingredient: {meta?.ingredients?.find((i:any) => i.id === team.mainIngredientId)?.name || "N/A"}
                        </p>
                     </div>
                     
                     {/* WhatsApp Button inside Welcome Box */}
                     {meta.whatsappLink && (
                        <a href={meta.whatsappLink} target="_blank" className="flex items-center gap-2 px-5 py-3 bg-white text-green-600 rounded-lg shadow font-bold hover:bg-gray-100 transition whitespace-nowrap">
                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 3.401 3.486-.906a5.77 5.77 0 002.946.814h.005c3.181.001 5.77-2.585 5.771-5.767.001-3.181-2.587-5.768-5.766-5.768zm0-2c4.285 0 7.767 3.481 7.767 7.766 0 4.288-3.483 7.769-7.771 7.769a7.712 7.712 0 01-3.523-.84l-4.502 1.169 1.196-4.383a7.755 7.755 0 01-1.077-4.113c.001-4.285 3.483-7.766 7.767-7.766z"/></svg>
                             Join WhatsApp Group
                        </a>
                     )}
                 </div>

                 {/* POS Credentials Display */}
                 {team.posUsername && team.posPassword && (
                     <div className="mt-4 bg-white/10 p-4 rounded border border-white/20">
                         <h3 className="font-bold text-lg mb-2">POS Login Credentials</h3>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <span className="block text-xs uppercase opacity-70">Username</span>
                                 <span className="font-mono text-xl font-bold select-all copy-all">{team.posUsername}</span>
                             </div>
                             <div>
                                 <span className="block text-xs uppercase opacity-70">Password</span>
                                 <span className="font-mono text-xl font-bold select-all copy-all">{team.posPassword}</span>
                             </div>
                         </div>
                         <p className="text-xs mt-2 opacity-80">Use these to login to the Cashier System.</p>
                     </div>
                 )}
        </div>
    )
}

// ----------------------------------------------------------------------
// INFO SECTION
// ----------------------------------------------------------------------
function InformationSection({ meta }: { meta: any }) {
    let sliderImages: any[] = [];
    try {
        if (meta.sliderImages) sliderImages = JSON.parse(meta.sliderImages);
        if (!Array.isArray(sliderImages)) sliderImages = [];
    } catch (e) { sliderImages = []; }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                {/* Slider */}
                {sliderImages.length > 0 && (
                    <div className="rounded-xl overflow-hidden shadow-lg bg-black h-64 md:h-80 lg:h-96 relative group">
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={0}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        className="h-full w-full"
                    >
                        {sliderImages.map((item, idx) => {
                            const src = typeof item === 'object' ? item.url : item;
                            const link = typeof item === 'object' ? item.link : null;
                            
                            const Content = (
                                <div className="w-full h-full relative">
                                    <img src={src} alt={`Slide ${idx}`} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                            );

                            return (
                                <SwiperSlide key={idx}>
                                    {link ? (
                                        <a href={link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                            {Content}
                                        </a>
                                    ) : Content}
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>
            )}
            </div>
            
            {/* Right: Info & Links (Takes 1 col, expands if no slider) */}
            <div className={`${sliderImages.length > 0 ? 'lg:col-span-1' : 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6'}`}>
                 {/* Event Poster Card */}
                 {meta.eventPoster && (
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700 mb-6">
                         <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">Event Poster</h3>
                         <div className="rounded overflow-hidden bg-gray-100">
                            <img src={meta.eventPoster} alt="Event Poster" className="w-full h-auto object-contain cursor-pointer transition hover:scale-105" onClick={()=>window.open(meta.eventPoster, '_blank')} />
                         </div>
                     </div>
                 )}
                 
                 {/* Official Resources Links Removed here as per request */}
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// DASHBOARD SECTION (Success)
// ----------------------------------------------------------------------

function DashboardSection({ team, meta }: { team: any, meta: any }) {
    // Due Date Check Helpers
    const isLate = (date: string | null) => {
        if (!date) return false;
        // Logic: if current time > due date, it's late. 
        // But we usually flag current submissions as late? Or the deadline has passed?
        return new Date() > new Date(date);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment / Welcome Box Removed from here (Moved to top) */}

            {/* Profile Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow col-span-1 md:col-span-2">
                 <h3 className="font-bold text-lg mb-4">Team Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-3">
                        <div>
                            <span className="text-gray-500 block text-xs">Leader</span>
                            <span className="font-semibold">{team.leaderName} ({team.leaderClass || '-'})</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs">Contact</span>
                            <span className="font-semibold">{team.contactInfo}</span>
                        </div>
                     </div>
                     <div>
                         <span className="text-gray-500 block text-xs">Members</span>
                         <ul className="list-disc pl-4 text-sm font-semibold">
                            {JSON.parse(team.members || "[]").map((m:any) => (
                                <li key={m.nis || m.name}>{m.name}</li>
                            ))}
                         </ul>
                     </div>
                 </div>
            </div>
        </div>
    );
}


