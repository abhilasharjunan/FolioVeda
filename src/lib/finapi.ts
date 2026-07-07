import { fetchSchemeDetails } from "./mfapi";
import { prisma } from "./prisma";

function getFundManagerFromPeer(peer: any): { name: string; tenure: string; experience: string } | null {
  if (!peer) return null;
  const name = peer.fundManagerName || peer.fund_manager_name || peer.fundManager?.name || null;
  const tenure = peer.fundManagerTenure || peer.fund_manager_tenure || peer.fundManager?.tenure || null;
  const experience = peer.fundManagerExperience || peer.fund_manager_experience || peer.fundManager?.experience || null;
  if (name) return { name, tenure: tenure || 'N/A', experience: experience || 'N/A' };
  return null;
}

export interface FundHoldings {
  stockName: string;
  allocation: number;
  sector: string;
}

export interface FundManager {
  name: string;
  tenure: string;
  experience: string;
}

export interface FundInsights {
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  aum: string;
  expenseRatio: string;
  portfolioTurnover: string;
  fundManager: FundManager;
  holdings: FundHoldings[];
  sectorAllocation: Record<string, number>;
  peers: any[];
}

export async function getFundInsights(schemeCode: string): Promise<FundInsights | null> {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const cached = await prisma.sectorCache.findUnique({
      where: { schemeCode },
    });
    if (cached && cached.fetchedAt > sixHoursAgo) {
      const sectorData = cached.sectorData as Record<string, number>;
      const schemeDetails = await fetchSchemeDetails(schemeCode);
      const schemeName = schemeDetails.meta?.scheme_name || schemeDetails.schemeName || `Scheme ${schemeCode}`;
      const fundHouse = schemeDetails.meta?.fund_house || "N/A";
      const dbScheme = await prisma.schemeMaster.findUnique({ where: { schemeCode }, select: { fundManagerName: true, fundManagerTenure: true } });
      return {
        schemeCode,
        schemeName,
        fundHouse,
        aum: "N/A",
        expenseRatio: "N/A",
        portfolioTurnover: "N/A",
        fundManager: { name: dbScheme?.fundManagerName || "Not Available", tenure: dbScheme?.fundManagerTenure || "N/A", experience: "N/A" },
        holdings: [],
        sectorAllocation: sectorData,
        peers: [],
      };
    }

    const schemeDetails = await fetchSchemeDetails(schemeCode);
    const schemeName = schemeDetails.meta?.scheme_name || schemeDetails.schemeName || `Scheme ${schemeCode}`;
    const fundHouse = schemeDetails.meta?.fund_house || "N/A";

    const isin = schemeDetails.meta?.isin_growth;

    if (!isin) {
      console.warn(`No ISIN found for scheme ${schemeCode}, returning partial data`);
      const dbScheme = await prisma.schemeMaster.findUnique({ where: { schemeCode }, select: { fundManagerName: true, fundManagerTenure: true } });
      return {
        schemeCode,
        schemeName,
        fundHouse,
        aum: "N/A",
        expenseRatio: "N/A",
        portfolioTurnover: "N/A",
        fundManager: { name: dbScheme?.fundManagerName || "Not Available", tenure: dbScheme?.fundManagerTenure || "N/A", experience: "N/A" },
        holdings: [],
        sectorAllocation: {},
        peers: [],
      };
    }

    const response = await fetch(`https://finapi.upvaly.com/api/mf/isin/${isin}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`FinAPI error ${response.status} for ${schemeCode}, returning mfapi.in data`);
      const dbScheme = await prisma.schemeMaster.findUnique({ where: { schemeCode }, select: { fundManagerName: true, fundManagerTenure: true } });
      return {
        schemeCode,
        schemeName,
        fundHouse,
        aum: "N/A",
        expenseRatio: "N/A",
        portfolioTurnover: "N/A",
        fundManager: { name: dbScheme?.fundManagerName || "Not Available", tenure: dbScheme?.fundManagerTenure || "N/A", experience: "N/A" },
        holdings: [],
        sectorAllocation: {},
        peers: [],
      };
    }

    const json = await response.json();
    const data = json.data?.[0];

    if (!data) {
      console.warn(`FinAPI returned empty data for ${schemeCode}, returning mfapi.in data`);
      const dbScheme = await prisma.schemeMaster.findUnique({ where: { schemeCode }, select: { fundManagerName: true, fundManagerTenure: true } });
      return {
        schemeCode,
        schemeName,
        fundHouse,
        aum: "N/A",
        expenseRatio: "N/A",
        portfolioTurnover: "N/A",
        fundManager: { name: dbScheme?.fundManagerName || "Not Available", tenure: dbScheme?.fundManagerTenure || "N/A", experience: "N/A" },
        holdings: [],
        sectorAllocation: {},
        peers: [],
      };
    }

    const holdings: FundHoldings[] = (data.holdings || [])
      .filter((h: any) => h.weightage && parseFloat(h.weightage) > 0)
      .slice(0, 15)
      .map((h: any) => ({
        stockName: h.name,
        allocation: parseFloat(h.weightage),
        sector: h.sector || "Other",
      }));

    const sectorAllocation: Record<string, number> = {};
    (data.sectors || []).forEach((s: any) => {
      sectorAllocation[s.sector] = parseFloat(s.weightage);
    });

    prisma.sectorCache.upsert({
      where: { schemeCode },
      update: { sectorData: sectorAllocation, fetchedAt: new Date() },
      create: { schemeCode, sectorData: sectorAllocation },
    }).catch(() => {});

    const currentPeer = (data.peers || []).find((p: any) => p.schemeCode === schemeCode) || data.peers?.[0];
    const peerManager = getFundManagerFromPeer(currentPeer);
    const dataManager = getFundManagerFromPeer(data);
    let fundManager: FundManager;
    if (peerManager) {
      fundManager = peerManager;
    } else if (dataManager) {
      fundManager = dataManager;
    } else {
      const dbScheme = await prisma.schemeMaster.findUnique({ where: { schemeCode }, select: { fundManagerName: true, fundManagerTenure: true } });
      fundManager = { name: dbScheme?.fundManagerName || "Not Available", tenure: dbScheme?.fundManagerTenure || "N/A", experience: "N/A" };
    }

    return {
      schemeCode,
      schemeName,
      fundHouse,
      aum: currentPeer?.aum || "N/A",
      expenseRatio: currentPeer?.expenseRatio || "N/A",
      portfolioTurnover: currentPeer?.portfolioTurnover || "N/A",
      fundManager,
      holdings,
      sectorAllocation,
      peers: data.peers || [],
    };
  } catch (error) {
    console.error(`Error fetching fund insights for ${schemeCode}:`, error);
    return null;
  }
}