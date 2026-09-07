import React, { useState } from "react";
import { FileText, Download, Printer, Copy, Check, X, Loader2, ShieldCheck, Ship } from "lucide-react";
import { generateVoyageReport } from "../api/client";
import { RouteResponse, VoyageReportResponse } from "../types";

interface VoyageBriefButtonProps {
  routeData: RouteResponse | null;
  selectedLeadDay: number;
  vesselClass: string;
  startPort: string;
  endPort: string;
  departureDate: string;
}

export const VoyageBriefButton: React.FC<VoyageBriefButtonProps> = ({
  routeData,
  selectedLeadDay,
  vesselClass,
  startPort,
  endPort,
  departureDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<VoyageReportResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "markdown" | "print">("summary");
  const [copied, setCopied] = useState(false);

  const handleGenerateBrief = async () => {
    setIsLoading(true);
    setIsOpen(true);
    try {
      const response = await generateVoyageReport({
        vessel_name: "RV Samudra Ratna (PC-4 Expedition Flagship)",
        vessel_class: vesselClass || "PC-4",
        start_port: startPort || "Cape Town",
        end_port: endPort || "Maitri Research Station",
        departure_date: departureDate || "2026-11-15",
        selected_lead_day: selectedLeadDay,
        route_details: routeData
      });
      setReportData(response);
    } catch (err) {
      console.error("Failed to generate voyage report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!reportData) return;
    navigator.clipboard.writeText(reportData.markdown_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!reportData) return;
    const blob = new Blob([reportData.markdown_content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportData.report_id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!reportData) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportData.html_content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        id="btn-generate-voyage-brief"
        onClick={handleGenerateBrief}
        className="px-3 py-1.5 rounded-none bg-brass/15 hover:bg-brass/25 active:bg-brass/30 text-brass border border-brass/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider"
        title="Generate Official IMO Polar Code Voyage Navigation Brief"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>GENERATE VOYAGE BRIEF</span>
      </button>

      {/* Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-ink/75 backdrop-blur-sm">
          <div
            id="voyage-brief-modal"
            className="bg-panel border border-hairline rounded-none shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-xs"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-hairline flex items-center justify-between bg-chart-bg/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brass" />
                <div>
                  <div className="font-bold text-ink text-sm tracking-wide uppercase">
                    VOYAGE NAVIGATION BRIEF & HAZARD ASSESSMENT
                  </div>
                  <div className="text-[10px] font-mono text-ink-muted">
                    NCPOR-MoES POLAR OPERATIONS // IMO POLAR CODE
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-ink-muted hover:text-ink rounded-none hover:bg-panel-low transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View Selector Tabs & Actions */}
            <div className="px-4 py-2 bg-panel-low border-b border-hairline flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-3 py-1 rounded-none text-xs font-medium uppercase tracking-wider transition-colors ${
                    activeTab === "summary"
                      ? "bg-brass text-chart-bg font-bold"
                      : "text-ink-muted hover:text-ink hover:bg-hairline"
                  }`}
                >
                  Executive Readout
                </button>
                <button
                  onClick={() => setActiveTab("markdown")}
                  className={`px-3 py-1 rounded-none text-xs font-medium uppercase tracking-wider transition-colors ${
                    activeTab === "markdown"
                      ? "bg-brass text-chart-bg font-bold"
                      : "text-ink-muted hover:text-ink hover:bg-hairline"
                  }`}
                >
                  Markdown Source
                </button>
              </div>

              {reportData && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-2 py-1 rounded-none bg-panel hover:bg-hairline border border-hairline text-ink-muted hover:text-ink font-mono text-[11px] flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-safe" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "COPIED" : "COPY MD"}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-2 py-1 rounded-none bg-panel hover:bg-hairline border border-hairline text-ink-muted hover:text-ink font-mono text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>EXPORT .MD</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-2.5 py-1 rounded-none bg-brass/20 hover:bg-brass/30 border border-brass/50 text-brass font-mono text-[11px] flex items-center gap-1 font-bold transition-colors"
                  >
                    <Printer className="w-3 h-3" />
                    <span>PRINT / PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-brass animate-spin" />
                  <p className="text-xs text-ink-muted font-mono">
                    COMPILING WAYPOINT TABLES, ICE CONVERGENCE CONES & VESSEL BURN ESTIMATES...
                  </p>
                </div>
              ) : reportData ? (
                activeTab === "summary" ? (
                  <div className="space-y-4">
                    {/* Identification Banner */}
                    <div className="p-3 rounded-none bg-panel-low border border-hairline flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-ink-muted uppercase">DOCUMENT IDENTIFIER</div>
                        <div className="font-mono text-sm font-bold text-ink">
                          {reportData.report_id}
                        </div>
                        <div className="text-[10px] text-ink-muted font-mono mt-0.5">
                          ISSUED: {reportData.generated_at}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-ink-muted uppercase">VESSEL & CORRIDOR</div>
                        <div className="font-semibold text-ink">
                          {reportData.vessel_name} (Class: {reportData.vessel_class})
                        </div>
                        <div className="text-[10px] font-mono text-brass mt-0.5">
                          {reportData.voyage_corridor}
                        </div>
                      </div>

                      <div className="px-2 py-1 rounded-none bg-brass/15 border border-brass/40 text-brass font-mono text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        POLAR CODE COMPLIANT
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-none bg-panel-low/60 border border-hairline">
                        <div className="text-[10px] text-ink-muted uppercase">Total Distance</div>
                        <div className="font-mono text-base font-bold text-ink mt-1">
                          {reportData.summary_metrics.total_distance_nm.toFixed(1)} NM
                        </div>
                        <div className="text-[10px] text-brass font-mono">A* Polar Grid</div>
                      </div>

                      <div className="p-2.5 rounded-none bg-panel-low/60 border border-hairline">
                        <div className="text-[10px] text-ink-muted uppercase">Fuel Saved</div>
                        <div className="font-mono text-base font-bold text-safe mt-1">
                          +{reportData.summary_metrics.fuel_saved_kg.toLocaleString()} kg
                        </div>
                        <div className="text-[10px] text-safe font-mono">
                          -{reportData.summary_metrics.fuel_saved_pct}% vs Geodesic
                        </div>
                      </div>

                      <div className="p-2.5 rounded-none bg-panel-low/60 border border-hairline">
                        <div className="text-[10px] text-ink-muted uppercase">Transit Duration</div>
                        <div className="font-mono text-base font-bold text-ink mt-1">
                          {reportData.summary_metrics.est_duration_hrs.toFixed(1)} hrs
                        </div>
                        <div className="text-[10px] text-ink-muted font-mono">
                          ~{reportData.summary_metrics.duration_days} days
                        </div>
                      </div>

                      <div className="p-2.5 rounded-none bg-panel-low/60 border border-hairline">
                        <div className="text-[10px] text-ink-muted uppercase">Mean Risk Score</div>
                        <div className="font-mono text-base font-bold text-brass mt-1">
                          {reportData.summary_metrics.mean_risk_score.toFixed(3)}
                        </div>
                        <div className="text-[10px] text-brass font-mono">
                          +{reportData.summary_metrics.safety_margin_improvement_pct}% Safety Margin
                        </div>
                      </div>
                    </div>

                    {/* Operational Directives */}
                    <div className="p-3 rounded-none bg-caution/10 border border-caution/40 space-y-1.5">
                      <div className="font-bold text-caution text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <Ship className="w-3.5 h-3.5" />
                        CRYOSPHERIC HAZARD ADVISORIES & BRIDGE DIRECTIVES
                      </div>
                      <ul className="space-y-1 text-ink text-[11px] list-disc list-inside">
                        {(reportData.hazard_advisories || []).map((adv, idx) => (
                          <li key={idx} className="leading-snug">
                            {adv}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Waypoints Preview */}
                    <div>
                      <div className="font-semibold text-ink mb-2 flex items-center justify-between uppercase tracking-wider">
                        <span>CRITICAL VOYAGE WAYPOINTS ({routeData?.waypoints?.length || 0} TOTAL)</span>
                        <span className="text-[10px] font-mono text-ink-muted">
                          Lead Day +{selectedLeadDay} SIC Forecast
                        </span>
                      </div>
                      <div className="border border-hairline rounded-none overflow-hidden">
                        <table className="w-full text-left font-mono text-[11px]">
                          <thead className="bg-panel-low text-ink-muted border-b border-hairline">
                            <tr>
                              <th className="py-1.5 px-3">#</th>
                              <th className="py-1.5 px-3">Lat / Lon</th>
                              <th className="py-1.5 px-3">Distance</th>
                              <th className="py-1.5 px-3">Est. Speed</th>
                              <th className="py-1.5 px-3">SIC</th>
                              <th className="py-1.5 px-3">Risk Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-hairline">
                            {(routeData?.waypoints || [])
                              .filter((_, idx) => idx % 2 === 0 || idx === ((routeData?.waypoints?.length || 1) - 1))
                              .map((wp) => (
                                <tr key={wp.step_index} className="hover:bg-panel-low/60 transition-colors">
                                  <td className="py-1.5 px-3 text-brass">#{wp.step_index}</td>
                                  <td className="py-1.5 px-3 text-ink">
                                    {Math.abs(wp.lat).toFixed(2)}°{wp.lat < 0 ? "S" : "N"},{" "}
                                    {Math.abs(wp.lon).toFixed(2)}°{wp.lon < 0 ? "W" : "E"}
                                  </td>
                                  <td className="py-1.5 px-3 text-ink-muted">{wp.cumulative_distance_nm} NM</td>
                                  <td className="py-1.5 px-3 text-ink">{wp.est_speed_knots} kts</td>
                                  <td className="py-1.5 px-3 text-ink-muted">{(wp.sic * 100).toFixed(0)}%</td>
                                  <td className="py-1.5 px-3">
                                    <span
                                      className="px-1.5 py-0.5 rounded-none text-[10px] font-bold"
                                      style={{
                                        color:
                                          wp.iceberg_risk_score >= 0.65
                                            ? "#B23A2F"
                                            : wp.iceberg_risk_score >= 0.3
                                            ? "#A9700F"
                                            : "#0E7C93",
                                        backgroundColor:
                                          wp.iceberg_risk_score >= 0.65
                                            ? "#B23A2F20"
                                            : wp.iceberg_risk_score >= 0.3
                                            ? "#A9700F20"
                                            : "#0E7C9320"
                                      }}
                                    >
                                      {wp.iceberg_risk_score.toFixed(2)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <pre className="p-3 rounded-none bg-chart-bg border border-hairline text-ink font-mono text-[11px] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {reportData.markdown_content}
                  </pre>
                )
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-hairline bg-chart-bg/80 flex items-center justify-between text-[11px] text-ink-muted">
              <span>National Centre for Polar and Ocean Research, Goa, India</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-none bg-panel-low hover:bg-hairline text-ink border border-hairline transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
