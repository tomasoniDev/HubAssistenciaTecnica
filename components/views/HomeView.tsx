"use client";

import type { Dispatch, SetStateAction } from "react";
import { MachineSortKey, SortDirection, View, displayMachineCode, formatDate, lastServiceDate, sortMark } from "@/lib/app-helpers";
import { Machine } from "@/lib/types";

export type HomeViewProps = {
  filteredMachines: Machine[];
  machineFilter: string;
  machineSort: { key: MachineSortKey; direction: SortDirection; };
  setHistoryFilter: Dispatch<SetStateAction<string>>;
  setMachineFilter: Dispatch<SetStateAction<string>>;
  setSelectedMachineId: Dispatch<SetStateAction<string>>;
  setView: Dispatch<SetStateAction<View>>;
  toggleMachineSort: (key: MachineSortKey) => void;
  view: View;
};

export function HomeView({
  filteredMachines,
  machineFilter,
  machineSort,
  setHistoryFilter,
  setMachineFilter,
  setSelectedMachineId,
  setView,
  toggleMachineSort,
  view
}: HomeViewProps) {
  return (
    <>
        {view === "home" && (
          <section className="view active">
            <div className="search-panel">
              <label>Filtrar máquinas<input value={machineFilter} onChange={(event) => setMachineFilter(event.target.value)} placeholder="Código, modelo, cliente..." /></label>
            </div>
            <section className="table-panel">
              <div className="section-header"><h2>Máquinas cadastradas</h2><span>{filteredMachines.length} registros</span></div>
              <div className="table-wrap">
                <table className="home-table">
                  <thead><tr>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("code")}>Código <span>{sortMark(machineSort.key === "code", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("model")}>Modelo <span>{sortMark(machineSort.key === "model", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("serial")}>Número série <span>{sortMark(machineSort.key === "serial", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("client")}>Cliente <span>{sortMark(machineSort.key === "client", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("unit_city")}>Unidade / Cidade <span>{sortMark(machineSort.key === "unit_city", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("vm")}>VM <span>{sortMark(machineSort.key === "vm", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("last_service")}>Último atendimento <span>{sortMark(machineSort.key === "last_service", machineSort.direction)}</span></button></th>
                  </tr></thead>
                  <tbody>
                    {filteredMachines.map((machine) => (
                      <tr key={machine.id}>
                        <td><button className="link-button" onClick={() => { setSelectedMachineId(machine.id); setHistoryFilter(""); setView("machineDetail"); }}>{displayMachineCode(machine)}</button></td>
                        <td>{machine.model || "-"}</td>
                        <td>{machine.serial || "-"}</td>
                        <td>{machine.client || "-"}</td>
                        <td>{machine.unit_city || "-"}</td>
                        <td>{machine.vm || "-"}</td>
                        <td>{formatDate(lastServiceDate(machine))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        )}
    </>
  );
}
