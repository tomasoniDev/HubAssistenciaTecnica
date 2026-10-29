"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { DetailIcon } from "@/components/icons";
import { STATE_CENTERS, View, displayMachineCode, formatDate, mapPointPosition, normalizeServiceType, percent } from "@/lib/app-helpers";
import { Machine, ServiceRecord } from "@/lib/types";

export type OverviewViewProps = {
  focusedMapState: string;
  focusOverviewMapState: (stateName: string) => void;
  mapMode: "loading" | "leaflet" | "fallback";
  openServiceRecord: (record: ServiceRecord) => Promise<void>;
  overviewData: { totalMachines: number; totalServices: number; servicesThisMonth: number; activeContracts: number; negotiatingContracts: number; expiringContracts: number; expiredContracts: number; remoteCoverage: number; staleMachines: number; machinesWithoutService: number; byModel: { name: string; value: number; }[]; byAccess: { name: string; value: number; }[]; byState: { name: string; value: number; }[]; geoStates: { state: string; value: number; machines: Machine[]; }[]; geoCities: { value: number; city: string; state: string; machines: Machine[]; }[]; byContractType: { name: string; value: number; }[]; byServiceType: { name: string; value: number; }[]; byClient: { name: string; value: number; }[]; byClientServices: { name: string; value: number; }[]; byVmSoftware: { name: string; value: number; }[]; serviceTrend: { name: string; value: number; }[]; topMachinesByService: { machine: Machine; value: number; }[]; machineAttention: { machine: Machine; lastDate: string; days: number | null; services: number; }[]; recentServices: { machine: Machine; record: ServiceRecord; }[]; };
  overviewMapRef: RefObject<HTMLDivElement | null>;
  setHistoryFilter: Dispatch<SetStateAction<string>>;
  setSelectedMachineId: Dispatch<SetStateAction<string>>;
  setView: Dispatch<SetStateAction<View>>;
  view: View;
};

export function OverviewView({
  focusedMapState,
  focusOverviewMapState,
  mapMode,
  openServiceRecord,
  overviewData,
  overviewMapRef,
  setHistoryFilter,
  setSelectedMachineId,
  setView,
  view
}: OverviewViewProps) {
  return (
    <>
        {view === "overview" && (
          <section className="overview-page view active">
            <section className="kpi-grid">
              <article className="kpi-card accent">
                <span>Base instalada</span>
                <strong>{overviewData.totalMachines}</strong>
                <small>{overviewData.totalServices} atendimentos registrados</small>
              </article>
              <article className="kpi-card">
                <span>Atendimentos no mês</span>
                <strong>{overviewData.servicesThisMonth}</strong>
                <small>{overviewData.totalServices ? `${percent(overviewData.servicesThisMonth, overviewData.totalServices)}% do histórico` : "Sem histórico"}</small>
              </article>
              <article className="kpi-card success">
                <span>Contratos ativos</span>
                <strong>{overviewData.activeContracts}</strong>
                <small>{percent(overviewData.activeContracts, overviewData.totalMachines)}% da base</small>
              </article>
              <article className="kpi-card warning">
                <span>Contratos a vencer</span>
                <strong>{overviewData.expiringContracts}</strong>
                <small>Próximos 90 dias</small>
              </article>
              <article className="kpi-card">
                <span>Cobertura remota</span>
                <strong>{overviewData.remoteCoverage}%</strong>
                <small>SINEMA ou VNC cadastrados</small>
              </article>
              <article className="kpi-card danger">
                <span>Atenção operacional</span>
                <strong>{overviewData.staleMachines}</strong>
                <small>Sem atendimento há mais de 180 dias ou sem histórico</small>
              </article>
            </section>

            <section className="overview-grid">
              <article className="dashboard-card chart-card wide-card">
                <div className="card-title"><DetailIcon type="history" /><h3>Tendência de atendimentos</h3></div>
                <div className="trend-chart">
                  {overviewData.serviceTrend.map((item) => {
                    const max = Math.max(...overviewData.serviceTrend.map((entry) => entry.value), 1);
                    return (
                      <div key={item.name} className="trend-bar">
                        <span>{item.value}</span>
                        <div style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }} />
                        <small>{item.name}</small>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="remote" /><h3>Acesso remoto</h3></div>
                <div className="bar-list">
                  {overviewData.byAccess.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.totalMachines)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="check" /><h3>Contratos</h3></div>
                <div className="contract-summary-list">
                  <div><span>Ativos</span><strong>{overviewData.activeContracts}</strong></div>
                  <div><span>Em negociação</span><strong>{overviewData.negotiatingContracts}</strong></div>
                  <div><span>A vencer em 90 dias</span><strong>{overviewData.expiringContracts}</strong></div>
                  <div><span>Vencidos</span><strong>{overviewData.expiredContracts}</strong></div>
                </div>
                <div className="bar-list compact">
                  {overviewData.byContractType.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.activeContracts)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="software" /><h3>Modelos</h3></div>
                <div className="bar-list">
                  {overviewData.byModel.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.totalMachines)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="software" /><h3>Softwares por VM</h3></div>
                <div className="bar-list">
                  {overviewData.byVmSoftware.length ? overviewData.byVmSoftware.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, Math.max(...overviewData.byVmSoftware.map((entry) => entry.value), 1))}%` }} /></em>
                    </div>
                  )) : <p className="empty-card-note">Nenhum código de software com VM cadastrada.</p>}
                </div>
              </article>

              <article className="dashboard-card geo-card">
                <div className="card-title"><DetailIcon type="location" /><h3>Geolocalização</h3><span className="soft-pill">Estados / cidades</span></div>
                <div className="geo-panel">
                  <div className={`real-map ${mapMode === "fallback" ? "fallback-map" : ""}`} ref={overviewMapRef} aria-label="Mapa de máquinas por estado e cidade">
                    {mapMode !== "leaflet" && (
                      <div className="map-fallback">
                        <span className="map-label north">Brasil</span>
                        <span className="map-label south">Sul / Sudeste</span>
                        {overviewData.geoStates.map((item) => {
                          const center = STATE_CENTERS[item.state];
                          if (!center) return null;
                          return (
                            <button
                              key={item.state}
                              className={`map-fallback-marker ${focusedMapState === item.state ? "active" : ""}`}
                              style={mapPointPosition(center)}
                              type="button"
                              title={`${item.state}: ${item.value} máquina${item.value === 1 ? "" : "s"}`}
                              onClick={() => focusOverviewMapState(item.state)}
                            >
                              <span>{item.state}</span>
                              <strong>{item.value}</strong>
                            </button>
                          );
                        })}
                        {mapMode === "loading" && <em>Carregando mapa...</em>}
                      </div>
                    )}
                  </div>
                  <div className="state-map-list">
                    {overviewData.byState.map((item) => (
                      <button
                        key={item.name}
                        className={focusedMapState === item.name ? "active" : ""}
                        type="button"
                        onClick={() => focusOverviewMapState(item.name)}
                      >
                        <span>{item.name}</span>
                        <strong>{item.value}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="client" /><h3>Clientes com mais máquinas</h3></div>
                <div className="bar-list">
                  {overviewData.byClient.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.totalMachines)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="history" /><h3>Clientes mais atendidos</h3></div>
                <div className="bar-list">
                  {overviewData.byClientServices.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.totalServices)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card service-type-card">
                <div className="card-title"><DetailIcon type="info" /><h3>Tipo de atendimento</h3></div>
                <div className="donut-panel">
                  <div className="donut" style={{ ["--value" as string]: `${percent(overviewData.byServiceType.find((item) => item.name === "Acesso remoto")?.value ?? 0, overviewData.totalServices)}%` }}>
                    <strong>{percent(overviewData.byServiceType.find((item) => item.name === "Acesso remoto")?.value ?? 0, overviewData.totalServices)}%</strong>
                    <span>Remoto</span>
                  </div>
                  <div className="mini-list">
                    {overviewData.byServiceType.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.value}</strong></div>)}
                  </div>
                </div>
              </article>

              <article className="dashboard-card overview-table-card service-rank-card">
                <div className="card-title"><DetailIcon type="history" /><h3>Máquinas com mais atendimentos</h3></div>
                <div className="overview-table">
                  {overviewData.topMachinesByService.map(({ machine, value }) => (
                    <button key={machine.id} type="button" onClick={() => { setSelectedMachineId(machine.id); setHistoryFilter(""); setView("machineDetail"); }}>
                      <span>{displayMachineCode(machine)}</span>
                      <em>{machine.client || "-"}</em>
                      <strong>{value}</strong>
                    </button>
                  ))}
                </div>
              </article>

              <article className="dashboard-card overview-table-card attention-rank-card">
                <div className="card-title"><DetailIcon type="alert" /><h3>Máquinas para atenção</h3></div>
                <div className="overview-table">
                  {overviewData.machineAttention.map(({ machine, lastDate, days }) => (
                    <button key={machine.id} type="button" onClick={() => { setSelectedMachineId(machine.id); setHistoryFilter(""); setView("machineDetail"); }}>
                      <span>{displayMachineCode(machine)}</span>
                      <em>{lastDate ? `Último: ${formatDate(lastDate)}` : "Sem histórico"}</em>
                      <strong>{days === null ? "-" : `${days}d`}</strong>
                    </button>
                  ))}
                </div>
              </article>

              <article className="dashboard-card overview-table-card recent-rank-card">
                <div className="card-title"><DetailIcon type="detail" /><h3>Últimos atendimentos</h3></div>
                <div className="overview-table">
                  {overviewData.recentServices.map(({ machine, record }) => (
                    <button key={record.id} type="button" onClick={() => { setSelectedMachineId(machine.id); void openServiceRecord(record); }}>
                      <span>{record.issue_summary || record.equipment || "Atendimento"}</span>
                      <em>{displayMachineCode(machine)} - {formatDate(record.service_date)}</em>
                      <strong>{normalizeServiceType(record.service_type).replace("Acesso remoto", "Remoto").replace("Visita técnica", "Visita")}</strong>
                    </button>
                  ))}
                </div>
              </article>
            </section>
          </section>
        )}
    </>
  );
}
