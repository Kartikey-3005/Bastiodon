"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Shield,
  Laptop,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  Sliders,
  LogOut,
  Bell,
  Eye,
  Calendar,
  Download,
  AlertOctagon,
  Flame,
  Gamepad2,
  Tv,
  Globe,
  Radio,
  FileText,
  KeyRound,
  Copy,
  ExternalLink,
  Filter,
  Trash2,
  Clock,
  Sparkles,
  LayoutGrid,
  TrendingUp,
  BarChart3,
  Database,
  FileSpreadsheet,
  Users,
  Compass,
  Zap,
  ChevronDown,
  Settings,
  HelpCircle,
  Activity,
  UserPlus,
  Share2,
  Check
} from "lucide-react";
import { API_BASE_URL, SOCKET_URL, ChildDevice, ScanLog } from "@/types";
import { fetchWithAuth, getAuthToken } from "@/lib/api";

const INITIAL_DEMO_DEVICES: ChildDevice[] = [
  {
    id: "demo-aarav",
    childName: "Aarav's Laptop",
    pairingCode: "BST-492",
    isOnline: true,
    incognitoBlocked: true,
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    blockingRule: {
      blockAdult: true,
      blockStreaming: false,
      blockGaming: true,
      customBlockedDomains: JSON.stringify(["gambling.com", "bet365.com"])
    }
  },
  {
    id: "demo-riya",
    childName: "Riya's Study PC",
    pairingCode: "BST-817",
    isOnline: false,
    incognitoBlocked: true,
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
    createdAt: new Date().toISOString(),
    blockingRule: {
      blockAdult: true,
      blockStreaming: true,
      blockGaming: true,
      customBlockedDomains: JSON.stringify(["instagram.com", "tiktok.com"])
    }
  }
];

const INITIAL_DEMO_LOGS: Record<string, ScanLog[]> = {
  "demo-aarav": [
    {
      id: "log-1",
      deviceId: "demo-aarav",
      url: "https://roblox.com/chat/general",
      domain: "Roblox Web Chat",
      contentType: "IN_GAME_CHAT",
      snippet: 'Message flagged: "where do you live send number"',
      severity: "WARNING",
      actionTaken: "FLAGGED",
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString()
    },
    {
      id: "log-2",
      deviceId: "demo-aarav",
      url: "https://netflix.com/browse",
      domain: "netflix.com",
      contentType: "URL",
      snippet: "Blocked because Streaming Sites toggle is ON",
      severity: "CRITICAL_ILLEGAL",
      actionTaken: "BLOCKED",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
    },
    {
      id: "log-3",
      deviceId: "demo-aarav",
      url: "https://khanacademy.org/math/algebra",
      domain: "khanacademy.org",
      contentType: "URL",
      snippet: "Linear Equations practice session (32 mins)",
      severity: "SAFE",
      actionTaken: "ALLOWED",
      timestamp: new Date(Date.now() - 1000 * 60 * 27).toISOString()
    },
    {
      id: "log-4",
      deviceId: "demo-aarav",
      url: "https://adult-site-blocked.com/video",
      domain: "adult-site-blocked.com",
      contentType: "URL",
      snippet: "Blocked automatically by Adult Filter",
      severity: "CRITICAL_ILLEGAL",
      actionTaken: "BLOCKED",
      timestamp: new Date(Date.now() - 1000 * 60 * 51).toISOString()
    },
    {
      id: "log-5",
      deviceId: "demo-aarav",
      url: "https://poki.com/en/g/subway-surfers",
      domain: "poki.com",
      contentType: "URL",
      snippet: "Online gaming portal blocked during study hours",
      severity: "CRITICAL_ILLEGAL",
      actionTaken: "BLOCKED",
      timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString()
    }
  ],
  "demo-riya": [
    {
      id: "log-riya-1",
      deviceId: "demo-riya",
      url: "https://netflix.com/browse",
      domain: "netflix.com",
      contentType: "URL",
      snippet: "Streaming platform blocked under evening study rule",
      severity: "CRITICAL_ILLEGAL",
      actionTaken: "BLOCKED",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: "log-riya-2",
      deviceId: "demo-riya",
      url: "https://byjus.com/physics/optics",
      domain: "byjus.com",
      contentType: "URL",
      snippet: "Physics ray optics revision reading",
      severity: "SAFE",
      actionTaken: "ALLOWED",
      timestamp: new Date(Date.now() - 1000 * 60 * 80).toISOString()
    }
  ]
};

export default function DashboardPage() {
  const router = useRouter();
  const [parent, setParent] = useState<any>(null);
  const [devices, setDevices] = useState<ChildDevice[]>(INITIAL_DEMO_DEVICES);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("demo-aarav");
  const [logsMap, setLogsMap] = useState<Record<string, ScanLog[]>>(INITIAL_DEMO_LOGS);
  const [activeTab, setActiveTab] = useState<"overview" | "feed" | "controls" | "report" | "pin">("overview");
  const [feedFilter, setFeedFilter] = useState<"ALL" | "BLOCKED" | "ALERT" | "SAFE">("ALL");

  const [blockAdult, setBlockAdult] = useState(true);
  const [blockStreaming, setBlockStreaming] = useState(false);
  const [streamingServices, setStreamingServices] = useState({
    netflix: true,
    prime: true,
    hotstar: true,
    jiocinema: true
  });
  const [blockGaming, setBlockGaming] = useState(true);
  const [lockIncognito, setLockIncognito] = useState(true);
  const [scanChats, setScanChats] = useState(true);
  const [customDomains, setCustomDomains] = useState<string[]>(["gambling.com", "bet365.com"]);
  const [newDomainInput, setNewDomainInput] = useState("");

  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "week">("today");
  const [dailySummaryData, setDailySummaryData] = useState<any>(null);

  const [parentPin, setParentPin] = useState("123456");
  const [newPinInput, setNewPinInput] = useState("");
  const [pinUpdateMessage, setPinUpdateMessage] = useState("");

  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [childNameInput, setChildNameInput] = useState("");
  const [newPairingCode, setNewPairingCode] = useState<string | null>(null);

  const [toastAlert, setToastAlert] = useState<{ message: string; type: "alert" | "safe" } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [metrics, setMetrics] = useState({
    totalInterventions: 1842,
    conversionRate: "7.8%",
    domainReach: 10200,
    dailyHours: 4.8
  });

  const socketRef = useRef<Socket | null>(null);

  const fetchDevices = async () => {
    try {
      const res = await fetchWithAuth("/api/devices");
      if (res.ok) {
        const data = await res.json();
        if (data.devices && data.devices.length > 0) {
          const mapped: ChildDevice[] = data.devices.map((d: any) => ({
            id: d.id,
            childName: d.name || "Child's Device",
            name: d.name,
            pairingCode: d.pairingCode,
            isOnline: Boolean(d.isOnline),
            incognitoBlocked: Boolean(d.incognitoLocked),
            incognitoLocked: Boolean(d.incognitoLocked),
            lastSeenAt: d.lastSeenAt || new Date().toISOString(),
            createdAt: d.createdAt || new Date().toISOString(),
            rules: d.rules,
            blockingRule: {
              blockAdult: d.rules?.blockAdult ?? true,
              blockStreaming: d.rules?.blockStreaming ?? false,
              blockGaming: d.rules?.blockGaming ?? false,
              customBlockedDomains: JSON.stringify(d.rules?.customDomains || [])
            }
          }));
          setDevices(mapped);
          setSelectedDeviceId((prev) => {
            const exists = mapped.some((m) => m.id === prev);
            return exists ? prev : mapped[0].id;
          });
        }
      }
    } catch { }
  };

  const fetchEvents = async (devId: string) => {
    try {
      const res = await fetchWithAuth(`/api/devices/${devId}/events?limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (data.events) {
          const mapped: ScanLog[] = data.events.map((e: any) => ({
            id: e.id,
            deviceId: e.deviceId,
            url: e.snippet?.startsWith("http") ? e.snippet : `https://${e.source}`,
            domain: e.source,
            source: e.source,
            eventType: e.eventType,
            contentType: e.eventType === "CHAT_ALERT" ? "IN_GAME_CHAT" : e.eventType === "SEARCH_ALERT" ? "SEARCH_QUERY" : "URL",
            snippet: e.snippet,
            severity: e.severity === "CRITICAL" ? "CRITICAL_ILLEGAL" : e.severity,
            actionTaken: e.eventType === "BLOCKED_DOMAIN" ? "BLOCKED" : e.eventType === "CHAT_ALERT" ? "FLAGGED" : "ALLOWED",
            timestamp: e.createdAt || new Date().toISOString()
          }));
          setLogsMap((prev) => ({
            ...prev,
            [devId]: mapped
          }));
        }
      }
    } catch { }
  };

  const fetchEodSummary = async (devId: string) => {
    try {
      const res = await fetchWithAuth(`/api/devices/${devId}/eod`);
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setDailySummaryData(data.summary);
          setMetrics((prev) => ({
            ...prev,
            totalInterventions: data.summary.blocksCount + data.summary.alertsCount || prev.totalInterventions,
            domainReach: data.summary.domainReach || prev.domainReach,
            dailyHours: data.summary.totalHours || prev.dailyHours
          }));
        }
      }
    } catch { }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("bastiodon_parent_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setParent(u);
        if (u.pinCode) setParentPin(u.pinCode);
      } catch { }
    } else {
      setParent({
        id: "demo-parent-account",
        name: "Demonstration Parent",
        email: "parent.demo@bastiodon.com",
        subscriptionTier: "PRO",
        pinCode: "654321"
      });
    }

    fetchWithAuth("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (me) {
          setParent((prev: any) => ({ ...prev, ...me }));
        }
      })
      .catch(() => { });

    fetchDevices();
  }, []);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  useEffect(() => {
    if (!selectedDevice) return;

    if (selectedDevice.rules) {
      const r = selectedDevice.rules;
      setBlockAdult(r.blockAdult);
      setBlockStreaming(r.blockStreaming);
      setBlockGaming(r.blockGaming);
      setLockIncognito(r.lockIncognito);
      setScanChats(r.scanChats);
      setCustomDomains(r.customDomains || []);
    } else if (selectedDevice.blockingRule) {
      const rule = selectedDevice.blockingRule;
      setBlockAdult(rule.blockAdult);
      setBlockStreaming(rule.blockStreaming);
      setBlockGaming(rule.blockGaming);
      try {
        setCustomDomains(JSON.parse(rule.customBlockedDomains || "[]"));
      } catch {
        setCustomDomains([]);
      }
      setLockIncognito(selectedDevice.incognitoBlocked !== false);
    }

    fetchEvents(selectedDevice.id);
    fetchEodSummary(selectedDevice.id);
  }, [selectedDeviceId]);

  const parentId = parent?.id;

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      const token = getAuthToken();
      socket.emit("join:parent", { parentId: parentId || "demo-parent-account", token });
    });

    socket.on("scanner:new_event", (event: any) => {
      const devId = event.deviceId || selectedDeviceId;
      const formattedLog: ScanLog = {
        id: event.id || `ev-${Date.now()}`,
        deviceId: devId,
        url: event.snippet?.startsWith("http") ? event.snippet : `https://${event.source}`,
        domain: event.source,
        source: event.source,
        eventType: event.eventType,
        contentType: event.eventType === "CHAT_ALERT" ? "IN_GAME_CHAT" : event.eventType === "SEARCH_ALERT" ? "SEARCH_QUERY" : "URL",
        snippet: event.snippet,
        severity: event.severity === "CRITICAL" ? "CRITICAL_ILLEGAL" : event.severity,
        actionTaken: event.eventType === "BLOCKED_DOMAIN" ? "BLOCKED" : event.eventType === "CHAT_ALERT" ? "FLAGGED" : "ALLOWED",
        timestamp: event.createdAt || new Date().toISOString()
      };

      setLogsMap((prev) => {
        const curr = prev[devId] || [];
        return { ...prev, [devId]: [formattedLog, ...curr] };
      });

      if (event.eventType === "BLOCKED_DOMAIN" || event.severity === "CRITICAL") {
        setToastAlert({
          message: `Blocked unsafe access: ${event.source}`,
          type: "alert"
        });
        setMetrics((m) => ({ ...m, totalInterventions: m.totalInterventions + 1 }));
      }
    });

    socket.on("rules:updated", (rules: any) => {
      setBlockAdult(rules.blockAdult);
      setBlockStreaming(rules.blockStreaming);
      setBlockGaming(rules.blockGaming);
      setLockIncognito(rules.lockIncognito);
      setScanChats(rules.scanChats);
      if (Array.isArray(rules.customDomains)) {
        setCustomDomains(rules.customDomains);
      }
      setToastAlert({
        message: "Protection rules updated in real time.",
        type: "safe"
      });
    });

    socket.on("device:status", (status: { deviceId: string; isOnline: boolean }) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === status.deviceId ? { ...d, isOnline: status.isOnline } : d))
      );
    });

    socket.on("eod:updated", (summary: any) => {
      setDailySummaryData(summary);
      if (summary.blocksCount !== undefined) {
        setMetrics((m) => ({
          ...m,
          totalInterventions: summary.blocksCount + (summary.alertsCount || 0)
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [parentId, selectedDeviceId]);

  const syncRulesToBackend = async (partialRule: Record<string, any>) => {
    if (!selectedDevice) return;
    try {
      await fetchWithAuth(`/api/devices/${selectedDevice.id}/rules`, {
        method: "PATCH",
        body: JSON.stringify(partialRule)
      });
    } catch { }
  };

  const loadDemoProfiles = () => {
    setDevices(INITIAL_DEMO_DEVICES);
    setSelectedDeviceId("demo-aarav");
    setLogsMap(INITIAL_DEMO_LOGS);
    setToastAlert({
      message: "Loaded demo profiles for Aarav and Riya.",
      type: "safe"
    });
  };

  const handleSimulateEvent = () => {
    if (!selectedDevice) return;
    const simulations: ScanLog[] = [
      {
        id: `sim-${Date.now()}-1`,
        deviceId: selectedDevice.id,
        url: "https://discord.com/channels/@me",
        domain: "Discord Web Chat",
        contentType: "IN_GAME_CHAT",
        snippet: 'Message flagged: "are you home alone, can we meet"',
        severity: "WARNING",
        actionTaken: "FLAGGED",
        timestamp: new Date().toISOString()
      },
      {
        id: `sim-${Date.now()}-2`,
        deviceId: selectedDevice.id,
        url: "https://twitch.tv/game_stream",
        domain: "twitch.tv",
        contentType: "URL",
        snippet: "Blocked live stream access under gaming restriction",
        severity: "CRITICAL_ILLEGAL",
        actionTaken: "BLOCKED",
        timestamp: new Date().toISOString()
      },
      {
        id: `sim-${Date.now()}-3`,
        deviceId: selectedDevice.id,
        url: "https://wikipedia.org/wiki/Solar_System",
        domain: "wikipedia.org",
        contentType: "URL",
        snippet: "Science research page opened for homework",
        severity: "SAFE",
        actionTaken: "ALLOWED",
        timestamp: new Date().toISOString()
      }
    ];

    const randomSample = simulations[Math.floor(Math.random() * simulations.length)];
    setLogsMap((prev) => {
      const current = prev[selectedDevice.id] || [];
      return {
        ...prev,
        [selectedDevice.id]: [randomSample, ...current]
      };
    });

    setToastAlert({
      message: `Simulated live event: ${randomSample.domain} (${randomSample.actionTaken})`,
      type: randomSample.actionTaken === "ALLOWED" ? "safe" : "alert"
    });
  };

  const handleBlockSpecificDomain = (domain: string) => {
    if (!customDomains.includes(domain)) {
      const updated = [...customDomains, domain];
      setCustomDomains(updated);
      syncRulesToBackend({ customDomains: updated });
      setToastAlert({
        message: `Added ${domain} to custom blocked websites.`,
        type: "safe"
      });
    }
  };

  const handleAddCustomDomain = () => {
    if (!newDomainInput.trim()) return;
    const clean = newDomainInput.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!customDomains.includes(clean)) {
      const updated = [...customDomains, clean];
      setCustomDomains(updated);
      syncRulesToBackend({ customDomains: updated });
      setToastAlert({
        message: `Blocked ${clean} across all browsers.`,
        type: "safe"
      });
    }
    setNewDomainInput("");
  };

  const handleRemoveCustomDomain = (dom: string) => {
    const updated = customDomains.filter((d) => d !== dom);
    setCustomDomains(updated);
    syncRulesToBackend({ customDomains: updated });
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length !== 6) {
      setPinUpdateMessage("PIN must be exactly 6 digits.");
      return;
    }

    try {
      const res = await fetchWithAuth("/api/auth/pin", {
        method: "PATCH",
        body: JSON.stringify({ newPin: newPinInput })
      });

      if (res.ok) {
        setParentPin(newPinInput);
        if (parent) {
          const updated = { ...parent, pinCode: newPinInput };
          localStorage.setItem("bastiodon_parent_user", JSON.stringify(updated));
          setParent(updated);
        }
        setNewPinInput("");
        setPinUpdateMessage("Parent PIN updated successfully.");
      } else {
        setPinUpdateMessage("Failed to update PIN on server.");
      }
    } catch {
      setParentPin(newPinInput);
      setNewPinInput("");
      setPinUpdateMessage("Parent PIN updated (local).");
    }
    setTimeout(() => setPinUpdateMessage(""), 4000);
  };

  const handleCopyPairingCode = () => {
    if (!selectedDevice) return;
    navigator.clipboard.writeText(selectedDevice.pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleFinalizeEod = async () => {
    if (!selectedDevice) return;
    try {
      const res = await fetchWithAuth(`/api/devices/${selectedDevice.id}/eod/finalize`, {
        method: "POST",
        body: JSON.stringify({ date: new Date().toISOString() })
      });
      if (res.ok) {
        const data = await res.json();
        setDailySummaryData(data.summary);
        setToastAlert({
          message: "End-of-day summary finalized for today.",
          type: "safe"
        });
      }
    } catch { }
  };

  const handleDownloadReport = () => {
    const reportText = `BASTIODON END-OF-DAY SAFETY SUMMARY
Device: ${selectedDevice.childName} (Pairing Code: ${selectedDevice.pairingCode})
Date: ${new Date().toLocaleDateString("en-IN")}
Status: Online & Protected

METRICS OVERVIEW:
- Total Active Screen Time: 2h 45m
- Safe Study & Reference: 1h 45m (64%)
- Safe Browsing & School Tools: 40m (24%)
- Blocked Browsing Attempts: 20m (12%)
- Total Flagged Messages / Alerts: 2

TOP WEBSITES VISITED:
1. khanacademy.org | Study & Homework | 55 mins (18 visits)
2. byjus.com | Science Lessons | 50 mins (14 visits)
3. wikipedia.org | Reference | 40 mins (8 visits)
4. google.com | Search Queries | 20 mins (22 searches)

RECORDED INCIDENTS & BLOCKED ATTEMPTS:
- 10:42 PM | Roblox Web Chat | Flagged: "where do you live send number"
- 10:35 PM | netflix.com | Blocked under Streaming rule
- 09:54 PM | adult-site-blocked.com | Blocked automatically by Adult Filter
- 09:30 PM | poki.com | Blocked gaming website

Exported securely by Bastiodon Platform.`;

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bastiodon_Report_${selectedDevice.childName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateNewDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childNameInput.trim()) return;

    try {
      const res = await fetchWithAuth("/api/devices/pairing-code", {
        method: "POST",
        body: JSON.stringify({
          name: childNameInput.trim(),
          browser: "Chrome Extension"
        })
      });

      if (res.ok) {
        const data = await res.json();
        const createdDev: ChildDevice = {
          id: data.device.id,
          childName: data.device.name,
          name: data.device.name,
          pairingCode: data.pairingCode,
          isOnline: false,
          incognitoBlocked: true,
          incognitoLocked: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          rules: data.device.rules
        };
        setDevices((prev) => [createdDev, ...prev]);
        setSelectedDeviceId(createdDev.id);
        setNewPairingCode(data.pairingCode);
        setLogsMap((prev) => ({ ...prev, [createdDev.id]: [] }));
        setChildNameInput("");
        return;
      }
    } catch { }

    const generatedCode = "BST-" + Math.floor(100 + Math.random() * 900);
    const newDev: ChildDevice = {
      id: `dev-${Date.now()}`,
      childName: childNameInput.trim(),
      pairingCode: generatedCode,
      isOnline: false,
      incognitoBlocked: true,
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      blockingRule: {
        blockAdult: true,
        blockStreaming: false,
        blockGaming: false,
        customBlockedDomains: "[]"
      }
    };

    setDevices([...devices, newDev]);
    setSelectedDeviceId(newDev.id);
    setNewPairingCode(generatedCode);
    setLogsMap({ ...logsMap, [newDev.id]: [] });
    setChildNameInput("");
  };

  const currentLogs = logsMap[selectedDevice?.id] || [];
  const filteredLogs = currentLogs.filter((log) => {
    if (feedFilter === "ALL") return true;
    if (feedFilter === "BLOCKED") return log.actionTaken === "BLOCKED";
    if (feedFilter === "ALERT") return log.actionTaken === "FLAGGED" || log.severity === "WARNING";
    if (feedFilter === "SAFE") return log.actionTaken === "ALLOWED" || log.severity === "SAFE";
    return true;
  });

  const hourBlocks = [
    [0, 1, 0, 0, 1, 2, 2, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 2, 3, 4, 3, 2, 1],
    [0, 0, 0, 0, 0, 1, 2, 3, 3, 2, 1, 1, 2, 3, 4, 4, 3, 3, 3, 4, 4, 3, 1, 0],
    [0, 0, 0, 1, 1, 2, 3, 3, 2, 2, 1, 2, 3, 3, 4, 4, 4, 3, 3, 4, 4, 2, 1, 0],
    [0, 0, 0, 0, 1, 2, 3, 4, 3, 2, 2, 2, 3, 4, 4, 4, 4, 3, 3, 4, 4, 3, 2, 0],
    [0, 1, 0, 0, 1, 2, 3, 3, 3, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 1],
    [0, 0, 1, 0, 0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1],
    [0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3, 2, 1, 0],
  ];

  const getHeatmapColor = (intensity: number) => {
    switch (intensity) {
      case 4:
        return "bg-white/90";
      case 3:
        return "bg-white/50";
      case 2:
        return "bg-white/25";
      case 1:
        return "bg-white/10";
      default:
        return "bg-white/[0.04]";
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#ECECEC] flex font-sans select-none antialiased">
      <aside className="w-16 md:w-18 bg-[#09090b] border-r border-[#1a1a1e] flex flex-col items-center py-5 shrink-0 z-20 justify-between">
        <div className="flex flex-col items-center gap-6 w-full">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#27272a] to-[#121214] border border-[#2e2e34] flex items-center justify-center text-white shadow-lg hover:border-white/40 transition-all group"
            title="Bastiodon Home"
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5 transform group-hover:rotate-45 transition-transform duration-300">
              <span className="w-1.5 h-1.5 bg-white rounded-[1px]"></span>
              <span className="w-1.5 h-1.5 bg-white/70 rounded-[1px]"></span>
              <span className="w-1.5 h-1.5 bg-white/40 rounded-[1px]"></span>
              <span className="w-1.5 h-1.5 bg-white rounded-[1px]"></span>
            </div>
          </Link>

          <div className="w-8 h-[1px] bg-[#1f1f23]"></div>

          <nav className="flex flex-col items-center gap-2 w-full px-2">
            <button
              onClick={() => setActiveTab("overview")}
              title="Overview"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "overview"
                  ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                  : "text-[#71717a] hover:text-[#e4e4e7] hover:bg-white/[0.04]"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("feed")}
              title="Live Telemetry Feed"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "feed"
                  ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                  : "text-[#71717a] hover:text-[#e4e4e7] hover:bg-white/[0.04]"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("controls")}
              title="Safety Controls & Rules"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "controls"
                  ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                  : "text-[#71717a] hover:text-[#e4e4e7] hover:bg-white/[0.04]"
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("report")}
              title="Daily Reports"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "report"
                  ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                  : "text-[#71717a] hover:text-[#e4e4e7] hover:bg-white/[0.04]"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab("pin")}
              title="Parent PIN & Pairing"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "pin"
                  ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                  : "text-[#71717a] hover:text-[#e4e4e7] hover:bg-white/[0.04]"
              }`}
            >
              <KeyRound className="w-4 h-4" />
            </button>
          </nav>
        </div>

        <div className="flex flex-col items-center gap-3 w-full px-2">
          <button
            onClick={() => {
              setNewPairingCode(null);
              setIsAddDeviceOpen(true);
            }}
            title="Add Child Device"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#71717a] hover:text-white hover:bg-white/[0.05] transition-all"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          <Link
            href="/login"
            title="Sign Out"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#71717a] hover:text-red-400 hover:bg-white/[0.05] transition-all"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#070707] overflow-y-auto">
        <header className="h-14 border-b border-[#18181b] px-6 flex items-center justify-between shrink-0 bg-[#070707]/90 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#71717a]">
              <LayoutGrid className="w-3.5 h-3.5 text-white/60" />
              <span className="text-white font-semibold capitalize tracking-wide">{activeTab}</span>
              <span className="text-white/20">&bull;</span>
              <span className="text-[#a1a1aa] font-mono text-[11px] tracking-wider uppercase">
                {selectedDevice?.childName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#111113] border border-[#222226] rounded-lg p-0.5">
              {devices.map((dev) => (
                <button
                  key={dev.id}
                  onClick={() => setSelectedDeviceId(dev.id)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                    selectedDevice?.id === dev.id
                      ? "bg-[#27272a] text-white shadow-sm"
                      : "text-[#80808a] hover:text-white"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dev.isOnline ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-neutral-600"
                    }`}
                  ></span>
                  <span>{dev.childName}</span>
                </button>
              ))}
            </div>

            <button
              onClick={loadDemoProfiles}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors flex items-center gap-1.5"
              title="Load demo safety logs"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span className="hidden sm:inline">Demo Data</span>
            </button>

            <button
              onClick={() => {
                setNewPairingCode(null);
                setIsAddDeviceOpen(true);
              }}
              className="px-3 py-1 rounded-lg text-[11px] font-semibold text-black bg-white hover:bg-neutral-200 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Device</span>
            </button>
          </div>
        </header>

        {toastAlert && (
          <div className="mx-6 mt-4 p-3 rounded-lg border border-white/10 bg-[#121216] flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  toastAlert.type === "alert" ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : "bg-emerald-400"
                }`}
              ></span>
              <span className="text-[#e4e4e7] font-medium">{toastAlert.message}</span>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="text-[#71717a] hover:text-white text-[11px] font-mono ml-4"
            >
              DISMISS
            </button>
          </div>
        )}

        <main className="flex-1 p-5 md:p-7 space-y-5 max-w-[1500px] w-full">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 bg-[#0d0d10] border border-[#1b1b20] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 border-t border-l border-white/30"></div>
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 border-t border-r border-white/30"></div>
                  <div className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 border-b border-l border-white/30"></div>
                  <div className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 border-b border-r border-white/30"></div>

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-white flex items-baseline gap-2">
                        <span>{metrics.conversionRate}</span>
                      </div>
                      <p className="text-[11px] text-[#71717a] mt-0.5">
                        Child protection funnel &bull; 5.6K clean sessions from 72K inspects &bull; Last 30 days
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-emerald-400 flex items-center justify-end gap-1">
                        <span>&uarr; 0.4%</span>
                      </div>
                      <span className="text-[11px] text-[#71717a]">vs prior 30 days</span>
                    </div>
                  </div>

                  <div className="mt-8 mb-2">
                    <div className="grid grid-cols-4 text-center text-xs font-semibold text-[#a1a1aa] mb-3">
                      <div>72K</div>
                      <div>38.2K</div>
                      <div>16.8K</div>
                      <div>5.6K</div>
                    </div>

                    <div className="relative h-44 w-full flex items-center">
                      <svg
                        className="w-full h-full"
                        viewBox="0 0 800 180"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#d4d4d8" stopOpacity="0.95" />
                            <stop offset="35%" stopColor="#71717a" stopOpacity="0.7" />
                            <stop offset="70%" stopColor="#3f3f46" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#18181b" stopOpacity="0.8" />
                          </linearGradient>
                          <linearGradient id="innerGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                          </linearGradient>
                        </defs>

                        <path
                          d="M 0,20 
                             C 120,20 160,50 240,55 
                             C 320,60 380,72 480,75 
                             C 580,78 680,82 800,83 
                             L 800,97 
                             C 680,98 580,102 480,105 
                             C 380,108 320,120 240,125 
                             C 160,130 120,160 0,160 
                             Z"
                          fill="url(#funnelGrad)"
                        />
                        <path
                          d="M 0,20 
                             C 120,20 160,50 240,55 
                             C 320,60 380,72 480,75 
                             C 580,78 680,82 800,83 
                             L 800,97 
                             C 680,98 580,102 480,105 
                             C 380,108 320,120 240,125 
                             C 160,130 120,160 0,160 
                             Z"
                          fill="url(#innerGlow)"
                        />

                        <line x1="200" y1="0" x2="200" y2="180" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="400" y1="0" x2="400" y2="180" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="600" y1="0" x2="600" y2="180" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
                      </svg>

                      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
                        <div className="w-1/4 flex justify-center">
                          <span className="px-3 py-1 rounded-full bg-white text-black text-xs font-bold shadow-md">
                            100%
                          </span>
                        </div>
                        <div className="w-1/4 flex justify-center">
                          <span className="px-3 py-1 rounded-full bg-[#18181b] border border-white/20 text-white text-xs font-bold">
                            53%
                          </span>
                        </div>
                        <div className="w-1/4 flex justify-center">
                          <span className="px-3 py-1 rounded-full bg-[#18181b] border border-white/20 text-white text-xs font-bold">
                            23%
                          </span>
                        </div>
                        <div className="w-1/4 flex justify-center">
                          <span className="px-3 py-1 rounded-full bg-white text-black text-xs font-bold shadow-md">
                            8%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 text-center text-[11px] text-[#71717a] mt-2">
                      <div>Raw Page Inspects</div>
                      <div>Safety Rules Scanned</div>
                      <div>Safe Study & Allowed</div>
                      <div>Clean Sessions</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-[#0d0d10] border border-[#1b1b20] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 border-t border-l border-white/30"></div>
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 border-t border-r border-white/30"></div>
                  <div className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 border-b border-l border-white/30"></div>
                  <div className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 border-b border-r border-white/30"></div>

                  <div>
                    <div className="text-2xl font-bold tracking-tight text-white">{metrics.totalInterventions.toLocaleString()}</div>
                    <p className="text-[11px] text-[#71717a] mt-0.5">Total blocked threats & safety interventions</p>
                  </div>

                  <div className="my-6 flex items-center justify-center">
                    <div className="relative w-48 h-48 rounded-full border border-[#27272a] p-2 flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs>
                          <pattern id="hatch1" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeWidth="1.2" />
                          </pattern>
                          <pattern id="hatch2" width="4" height="4" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="4" stroke="#d4d4d8" strokeWidth="1.2" />
                          </pattern>
                          <pattern id="hatch3" width="3" height="3" patternTransform="rotate(0 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="3" stroke="#a1a1aa" strokeWidth="1" />
                          </pattern>
                          <pattern id="hatch4" width="3" height="3" patternTransform="rotate(90 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="3" y2="0" stroke="#71717a" strokeWidth="1" />
                          </pattern>
                        </defs>

                        <path d="M 50,50 L 50,2 A 48,48 0 0,1 98,50 Z" fill="url(#hatch1)" stroke="#0d0d10" strokeWidth="2" />
                        <path d="M 50,50 L 98,50 A 48,48 0 0,1 50,98 Z" fill="url(#hatch2)" stroke="#0d0d10" strokeWidth="2" />
                        <path d="M 50,50 L 50,98 A 48,48 0 0,1 15,82 Z" fill="url(#hatch3)" stroke="#0d0d10" strokeWidth="2" />
                        <path d="M 50,50 L 15,82 A 48,48 0 0,1 50,2 Z" fill="url(#hatch4)" stroke="#0d0d10" strokeWidth="2" />
                        <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#71717a] border-t border-[#1a1a1e] pt-3">
                    <span className="flex items-center gap-1.5 text-white/80">
                      <span className="w-2 h-2 rounded-sm bg-white"></span> Adult & Explicit
                    </span>
                    <span className="flex items-center gap-1.5 text-white/80">
                      <span className="w-2 h-2 rounded-sm bg-[#a1a1aa]"></span> Gaming
                    </span>
                    <span className="flex items-center gap-1.5 text-white/80">
                      <span className="w-2 h-2 rounded-sm bg-[#71717a]"></span> Chat Risks
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-[#0d0d10] border border-[#1b1b20] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-[#71717a] mb-4">
                    <span className="flex items-center gap-1.5 text-[#a1a1aa]">
                      <Compass className="w-3.5 h-3.5" /> Traffic Sources
                    </span>
                    <span>12 months</span>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { name: "Organic search", count: "4.1K", pct: "75%" },
                      { name: "Direct", count: "2.9K", pct: "55%" },
                      { name: "Referral", count: "1.6K", pct: "35%" },
                      { name: "Paid social", count: "980", pct: "20%" },
                      { name: "Email", count: "620", pct: "12%" }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white font-medium">{item.name}</span>
                          <span className="text-[#a1a1aa] font-mono">{item.count}</span>
                        </div>
                        <div className="w-full h-1 bg-[#1c1c22] rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-white/70 rounded-full"
                            style={{ width: item.pct }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#18181b] flex items-center justify-between text-[11px] text-[#71717a]">
                    <span>Total domain reach</span>
                    <span className="text-white font-mono font-medium">{metrics.domainReach.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-[#0d0d10] border border-[#1b1b20] rounded-xl p-5 relative overflow-hidden flex flex-col items-center justify-center text-center">
                  <div className="w-full flex items-center justify-between text-xs text-[#71717a] mb-6">
                    <span className="flex items-center gap-1.5 text-[#a1a1aa]">
                      <Users className="w-3.5 h-3.5" /> Guardians & Family
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">SYNC ACTIVE</span>
                  </div>

                  <div className="flex -space-x-2 my-2">
                    <div className="w-10 h-10 rounded-full bg-[#27272a] border-2 border-[#0d0d10] flex items-center justify-center text-xs font-bold text-white shadow-md">
                      P1
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-[#0d0d10] flex items-center justify-center text-xs font-bold text-black shadow-md">
                      B
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#18181b] border-2 border-[#0d0d10] flex items-center justify-center text-xs font-bold text-white shadow-md">
                      P2
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-white mt-3">Family Guard Circle</h4>
                  <p className="text-xs text-[#71717a] max-w-[210px] mt-1">
                    Invite another parent or tutor to manage rules for this child.
                  </p>

                  <button
                    onClick={() => {
                      setToastAlert({
                        message: "Guardian invite link copied to clipboard.",
                        type: "safe"
                      });
                    }}
                    className="mt-5 px-4 py-1.5 rounded-lg border border-[#2e2e34] hover:border-white/40 text-xs font-semibold text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Invite Guardian</span>
                  </button>
                </div>

                <div className="bg-[#0d0d10] border border-[#1b1b20] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-[#71717a]">
                    <span className="flex items-center gap-1.5 text-[#a1a1aa]">
                      <Clock className="w-3.5 h-3.5" /> Activity by hour
                    </span>
                    <span>Last 7 days</span>
                  </div>

                  <div className="my-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-xl font-bold text-white">{metrics.dailyHours}h / day</div>
                      <span className="text-[10px] text-[#71717a]">Peak: Sat 9p&ndash;10p</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-white/80">1.5h</div>
                      <span className="text-[10px] text-[#71717a]">Avg / hour</span>
                    </div>
                  </div>

                  <div className="space-y-1 my-1">
                    <div className="grid grid-cols-24 gap-[2px]">
                      {hourBlocks.map((row, rIdx) => (
                        <React.Fragment key={rIdx}>
                          {row.map((val, cIdx) => (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              className={`h-2.5 rounded-[1px] ${getHeatmapColor(val)}`}
                              title={`Hour ${cIdx}:00, Level ${val}`}
                            ></div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="flex justify-between text-[9px] font-mono text-[#52525b] pt-1">
                      <span>12a</span>
                      <span>6a</span>
                      <span>12p</span>
                      <span>6p</span>
                      <span>12a</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#71717a] pt-2 border-t border-[#18181b]">
                    <span>Lower</span>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-[1px] bg-white/[0.04]"></span>
                      <span className="w-2 h-2 rounded-[1px] bg-white/25"></span>
                      <span className="w-2 h-2 rounded-[1px] bg-white/50"></span>
                      <span className="w-2 h-2 rounded-[1px] bg-white/90"></span>
                    </div>
                    <span>Higher</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "feed" && (
            <div className="bg-[#0d0d10] border border-[#1b1b20] rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1b1b20] gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-white" />
                    Live Activity Stream &bull; {selectedDevice?.childName}
                  </h2>
                  <p className="text-xs text-[#71717a]">
                    Zero-delay telemetry feed recording searches, visits, and chat triggers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateEvent}
                    className="px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-neutral-200 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simulate Event</span>
                  </button>

                  <button
                    onClick={() => {
                      if (selectedDevice) fetchEvents(selectedDevice.id);
                      setToastAlert({ message: "Feed refreshed.", type: "safe" });
                    }}
                    className="p-1.5 border border-[#27272a] rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.05] transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pb-1">
                <span className="text-xs text-[#71717a] mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                {(["ALL", "BLOCKED", "ALERT", "SAFE"] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFeedFilter(filterOption)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      feedFilter === filterOption
                        ? "bg-white text-black font-semibold"
                        : "bg-[#18181b] text-[#a1a1aa] hover:text-white hover:bg-[#27272a]"
                    }`}
                  >
                    {filterOption === "ALL" && "All Activity"}
                    {filterOption === "BLOCKED" && "Blocked Sites"}
                    {filterOption === "ALERT" && "Chat & Search Alerts"}
                    {filterOption === "SAFE" && "Allowed"}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {filteredLogs.map((log) => {
                  const isBlocked = log.actionTaken === "BLOCKED" || log.severity === "CRITICAL_ILLEGAL";
                  const isAlert = log.actionTaken === "FLAGGED" || log.severity === "WARNING";

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-lg border border-[#1b1b20] bg-[#111114] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-white/20 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide font-mono ${
                              isBlocked
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : isAlert
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {isBlocked ? "BLOCKED" : isAlert ? "ALERT" : "ALLOWED"}
                          </span>
                          <span className="text-xs font-semibold text-white">{log.domain || log.source}</span>
                          <span className="text-[11px] text-[#71717a] font-mono">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-[#a1a1aa] font-sans">{log.snippet}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {log.actionTaken !== "BLOCKED" && (log.domain || log.source) && (
                          <button
                            onClick={() => handleBlockSpecificDomain((log.domain || log.source) as string)}
                            className="px-2.5 py-1 text-[11px] font-medium border border-[#27272a] rounded-md text-[#a1a1aa] hover:text-white hover:border-white/30 transition-colors"
                          >
                            Block Domain
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <div className="text-center py-12 text-xs text-[#71717a]">
                    No entries matching &quot;{feedFilter}&quot;.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "controls" && (
            <div className="bg-[#0d0d10] border border-[#1b1b20] rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-[#1b1b20]">
                <h2 className="text-base font-bold text-white">Browser Protection Switches</h2>
                <p className="text-xs text-[#71717a]">
                  Changes propagate to {selectedDevice?.childName}&apos;s laptop immediately.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-[#1b1b20] bg-[#111114] flex items-start justify-between">
                  <div className="pr-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Block Adult & Explicit Websites
                      </h4>
                    </div>
                    <p className="text-xs text-[#71717a]">
                      Pre-emptively blocks adult domains, gambling, and violent content.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={blockAdult}
                    onChange={(e) => {
                      setBlockAdult(e.target.checked);
                      syncRulesToBackend({ blockAdult: e.target.checked });
                      setToastAlert({
                        message: e.target.checked ? "Adult filter ON" : "Adult filter OFF",
                        type: "safe"
                      });
                    }}
                    className="w-5 h-5 accent-white cursor-pointer mt-1"
                  />
                </div>

                <div className="p-4 rounded-xl border border-[#1b1b20] bg-[#111114] space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="pr-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-sky-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Block Streaming Video Platforms
                        </h4>
                      </div>
                      <p className="text-xs text-[#71717a]">
                        Lock out streaming websites during designated homework sessions.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={blockStreaming}
                      onChange={(e) => {
                        setBlockStreaming(e.target.checked);
                        syncRulesToBackend({ blockStreaming: e.target.checked });
                        setToastAlert({
                          message: e.target.checked ? "Streaming lock ON" : "Streaming lock OFF",
                          type: "safe"
                        });
                      }}
                      className="w-5 h-5 accent-white cursor-pointer mt-1"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#1b1b20] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { key: "netflix", label: "Netflix" },
                      { key: "prime", label: "Prime Video" },
                      { key: "hotstar", label: "Disney+ Hotstar" },
                      { key: "jiocinema", label: "JioCinema" }
                    ].map((s) => (
                      <label key={s.key} className="flex items-center gap-2 text-[#a1a1aa] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={streamingServices[s.key as keyof typeof streamingServices]}
                          onChange={(e) =>
                            setStreamingServices({
                              ...streamingServices,
                              [s.key]: e.target.checked
                            })
                          }
                          className="w-3.5 h-3.5 accent-white rounded"
                        />
                        <span>{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#1b1b20] bg-[#111114] flex items-start justify-between">
                  <div className="pr-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Block Browser Gaming Sites
                      </h4>
                    </div>
                    <p className="text-xs text-[#71717a]">
                      Blocks Poki, CrazyGames, Roblox Web, and browser gaming mirrors.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={blockGaming}
                    onChange={(e) => {
                      setBlockGaming(e.target.checked);
                      syncRulesToBackend({ blockGaming: e.target.checked });
                      setToastAlert({
                        message: e.target.checked ? "Gaming filter ON" : "Gaming filter OFF",
                        type: "safe"
                      });
                    }}
                    className="w-5 h-5 accent-white cursor-pointer mt-1"
                  />
                </div>

                <div className="p-4 rounded-xl border border-[#1b1b20] bg-[#111114] flex items-start justify-between">
                  <div className="pr-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Incognito Window Lock
                      </h4>
                    </div>
                    <p className="text-xs text-[#71717a]">
                      Enforces rule checking by disallowing private browser sessions.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={lockIncognito}
                    onChange={(e) => {
                      setLockIncognito(e.target.checked);
                      syncRulesToBackend({ lockIncognito: e.target.checked });
                      setToastAlert({
                        message: e.target.checked ? "Incognito lock ON" : "Incognito lock OFF",
                        type: "safe"
                      });
                    }}
                    className="w-5 h-5 accent-white cursor-pointer mt-1"
                  />
                </div>

                <div className="p-4 rounded-xl border border-[#1b1b20] bg-[#111114] flex items-start justify-between">
                  <div className="pr-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        In-Game & Web Chat Scanner
                      </h4>
                    </div>
                    <p className="text-xs text-[#71717a]">
                      Flags predator patterns, location requests, and personal phone exchanges in chats.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={scanChats}
                    onChange={(e) => {
                      setScanChats(e.target.checked);
                      syncRulesToBackend({ scanChats: e.target.checked });
                      setToastAlert({
                        message: e.target.checked ? "Chat scanner ON" : "Chat scanner OFF",
                        type: "safe"
                      });
                    }}
                    className="w-5 h-5 accent-white cursor-pointer mt-1"
                  />
                </div>
              </div>

              <div className="border border-[#1b1b20] rounded-xl p-5 bg-[#111114] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Custom Blocked Domains</h4>
                  <p className="text-xs text-[#71717a] mt-0.5">
                    Add specific domains to disallow on this child device.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    placeholder="e.g. reddit.com or discord.com"
                    className="flex-1 px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-white outline-none focus:border-white/40"
                  />
                  <button
                    onClick={handleAddCustomDomain}
                    className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-xs hover:bg-neutral-200 transition-colors"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {customDomains.map((dom) => (
                    <span
                      key={dom}
                      className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded-md text-xs text-[#e4e4e7] flex items-center gap-1.5 font-mono"
                    >
                      {dom}
                      <button
                        onClick={() => handleRemoveCustomDomain(dom)}
                        className="text-rose-400 hover:text-rose-300 ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {customDomains.length === 0 && (
                    <span className="text-xs text-[#71717a]">No custom websites added.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "report" && (
            <div className="bg-[#0d0d10] border border-[#1b1b20] rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1b1b20] gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                    Daily Summary Report &bull; {selectedDevice?.childName}
                  </h2>
                  <p className="text-xs text-[#71717a]">
                    Nightly rollup of visited domains, active time, and blocked attempts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFinalizeEod}
                    className="px-3.5 py-1.5 border border-white/20 text-white text-xs font-semibold rounded-lg hover:bg-white/[0.08] transition-colors"
                  >
                    Finalize Today
                  </button>

                  <button
                    onClick={handleDownloadReport}
                    className="px-3.5 py-1.5 bg-white text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-neutral-200 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#1b1b20] bg-[#111114] space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Time Distribution
                </span>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#1c1c22]">
                  <div className="bg-white h-full" style={{ width: "64%" }}></div>
                  <div className="bg-[#71717a] h-full" style={{ width: "24%" }}></div>
                  <div className="bg-[#27272a] h-full" style={{ width: "12%" }}></div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs text-[#a1a1aa] pt-1">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                    Study & Reference: <strong className="text-white">1h 45m (64%)</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#71717a]"></span>
                    Safe Browsing: <strong className="text-white">40m (24%)</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27272a]"></span>
                    Blocked Attempts: <strong className="text-white">20m (12%)</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Top Visited Websites</h4>
                <div className="border border-[#1b1b20] rounded-xl overflow-hidden bg-[#111114]">
                  <table className="w-full text-left text-xs text-[#a1a1aa]">
                    <thead className="bg-[#09090b] border-b border-[#1b1b20] text-[11px] font-mono text-[#71717a] uppercase">
                      <tr>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Time Spent</th>
                        <th className="py-3 px-4">Visits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b1b20]">
                      <tr>
                        <td className="py-3 px-4 font-semibold text-white">khanacademy.org</td>
                        <td className="py-3 px-4">Study & Homework</td>
                        <td className="py-3 px-4 font-mono text-white">55 mins</td>
                        <td className="py-3 px-4 font-mono">18 visits</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-white">byjus.com</td>
                        <td className="py-3 px-4">Science & Math Lessons</td>
                        <td className="py-3 px-4 font-mono text-white">50 mins</td>
                        <td className="py-3 px-4 font-mono">14 visits</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-white">wikipedia.org</td>
                        <td className="py-3 px-4">Reference</td>
                        <td className="py-3 px-4 font-mono text-white">40 mins</td>
                        <td className="py-3 px-4 font-mono">8 visits</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-white">google.com</td>
                        <td className="py-3 px-4">Search Queries</td>
                        <td className="py-3 px-4 font-mono text-white">20 mins</td>
                        <td className="py-3 px-4 font-mono">22 searches</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pin" && (
            <div className="bg-[#0d0d10] border border-[#1b1b20] rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-[#1b1b20]">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-white" />
                  Parent Master PIN & Device Pairing
                </h2>
                <p className="text-xs text-[#71717a]">
                  This PIN is required on the child laptop to pause, configure, or uninstall the browser extension.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[#1b1b20] bg-[#111114] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-[#71717a] block">
                    Pairing Code for {selectedDevice?.childName}
                  </span>
                  <span className="text-2xl font-mono font-bold text-white tracking-widest mt-1 block">
                    {selectedDevice?.pairingCode}
                  </span>
                  <span className="text-xs text-[#71717a]">
                    Enter inside the Chrome/Edge extension popup on child&apos;s machine.
                  </span>
                </div>

                <button
                  onClick={handleCopyPairingCode}
                  className="px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg flex items-center gap-2 shrink-0 hover:bg-neutral-200 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                </button>
              </div>

              <div className="border border-[#1b1b20] rounded-xl p-5 bg-[#111114] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Update Master PIN</h4>
                <p className="text-xs text-[#71717a]">
                  Active PIN: <strong className="font-mono text-white tracking-widest">{parentPin}</strong>
                </p>

                {pinUpdateMessage && (
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs rounded-lg font-mono">
                    {pinUpdateMessage}
                  </div>
                )}

                <form onSubmit={handleSavePin} className="flex gap-2 max-w-sm">
                  <input
                    type="password"
                    maxLength={6}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="New 6-digit PIN"
                    className="flex-1 px-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-white font-mono tracking-widest outline-none focus:border-white/40"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-xs hover:bg-neutral-200 transition-colors"
                  >
                    Save PIN
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {isAddDeviceOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d0d10] rounded-xl border border-[#27272a] max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Child Device</h3>
            <p className="text-xs text-[#71717a]">
              Connect another school laptop or family computer to your account.
            </p>

            {!newPairingCode ? (
              <form onSubmit={handleCreateNewDevice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                    Child / Device Name
                  </label>
                  <input
                    type="text"
                    required
                    value={childNameInput}
                    onChange={(e) => setChildNameInput(e.target.value)}
                    placeholder="e.g. Kabir's Laptop"
                    className="w-full px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-xs text-white outline-none focus:border-white/40"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDeviceOpen(false)}
                    className="px-4 py-2 border border-[#27272a] rounded-lg text-xs font-medium text-[#a1a1aa] hover:text-white hover:bg-white/[0.04]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black rounded-lg text-xs font-semibold hover:bg-neutral-200"
                  >
                    Generate Code
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-[#09090b] rounded-xl border border-dashed border-[#2e2e34]">
                  <span className="text-xs text-[#71717a] block">
                    Enter this code in child&apos;s browser extension:
                  </span>
                  <span className="text-2xl font-mono font-bold text-white tracking-widest my-2 block">
                    {newPairingCode}
                  </span>
                  <span className="text-xs text-[#71717a]">Master PIN: {parentPin}</span>
                </div>

                <button
                  onClick={() => setIsAddDeviceOpen(false)}
                  className="w-full py-2 bg-white text-black rounded-lg text-xs font-semibold hover:bg-neutral-200"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
