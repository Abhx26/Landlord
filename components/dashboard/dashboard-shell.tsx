"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card transform transition-transform duration-200 ease-in-out
                    md:relative md:translate-x-0
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <div className="p-4 sm:p-6 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            LM
                        </div>
                        <span className="font-semibold text-lg">LandlordMgmt</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div onClick={() => setSidebarOpen(false)}>
                    <DashboardNav />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <div className="border-b border-border bg-card px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h1 className="text-lg sm:text-2xl font-bold text-foreground">Dashboard</h1>
                    </div>
                    <div>
                        <SignOutButton />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="p-4 sm:p-6 lg:p-8">{children}</div>
                </div>
            </div>
        </div>
    );
}
