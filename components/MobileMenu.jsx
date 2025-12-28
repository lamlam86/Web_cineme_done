"use client";
import { useState } from "react";
import Link from "next/link";

const NAV = [
    { href: "/movie", label: "Đặt vé ngay" },
    { href: "/popcorn-drink", label: "Đặt bắp nước" },
    { href: "/phim-dang-chieu", label: "Đang chiếu" },
    { href: "/phim-sap-chieu", label: "Sắp chiếu" },
];

export default function MobileMenu() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button className="header__hamburger" aria-label="Mở menu" onClick={() => setOpen(true)}>
                <span /><span /><span />
            </button>
            {open && (
                <div className="mnav">
                    <div className="mnav__sheet">
                        <button className="mnav__close" aria-label="Đóng" onClick={() => setOpen(false)}>✕</button>
                        <ul className="mnav__list">
                            {NAV.map(n => (
                                <li key={n.href}>
                                    <Link href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>
                                </li>
                            ))}
                            <li className="mnav__auth">
                                <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
                                <Link href="/signup" onClick={() => setOpen(false)}>Register</Link>
                            </li>
                        </ul>
                    </div>
                    <div className="mnav__backdrop" onClick={() => setOpen(false)} />
                </div>
            )}
        </>
    );
}









