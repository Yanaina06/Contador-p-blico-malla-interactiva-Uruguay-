import React, { useState, useEffect } from "react";
import { materias } from "./data";
import "./Malla.css";

function getSemestres(mats) {
  return [...new Set(mats.map((m) => m.semestre))].sort((a, b) => a - b);
}

function getMateriasPorSemestre(mats, semestre) {
  return mats.filter((m) => m.semestre === semestre);
}

function cumpleRequisitos(materia, materiasAprobadas, materiaPorNombre) {
  // Para requisitos tipo 'X créditos en área Y'
  for (let req of materia.requisitos) {
    const match = req.match(/(\d+)\s+créditos? en el área ([\w\s]+)/i);
    if (match) {
      const [_, cantidad, area] = match;
      const suma = materiasAprobadas
        .map((n) => materiaPorNombre[n])
        .filter((m) => m.area?.toLowerCase().includes(area.toLowerCase()))
        .reduce((acc, m) => acc + (m.creditos || 0), 0);
      if (suma < parseInt(cantidad)) return false;
    } else if (/(\d+)\s+créditos/i.test(req)) {
      // para "50 créditos del área contable", etc.
      const num = req.match(/(\d+)\s+créditos/i)[1];
      const suma = materiasAprobadas
        .map((n) => materiaPorNombre[n])
        .reduce((acc, m) => acc + (m.creditos || 0), 0);
      if (suma < parseInt(num)) return false;
    } else if (!materiasAprobadas.includes(req)) {
      return false;
    }
  }
  return true;
}

export default function Malla({ color = "#e91e63" }) {
  const [aprobadas, setAprobadas] = useState(() =>
    JSON.parse(localStorage.getItem("materiasAprobadas") || "[]")
  );
  useEffect(() => {
    localStorage.setItem("materiasAprobadas", JSON.stringify(aprobadas));
  }, [aprobadas]);

  // Para acceder a las materias por nombre rápidamente
  const materiaPorNombre = {};
  materias.forEach((m) => (materiaPorNombre[m.nombre] = m));

  const semestres = getSemestres(materias);

  function handleMateriaClick(materia) {
    if (aprobadas.includes(materia.nombre)) {
      setAprobadas(aprobadas.filter((n) => n !== materia.nombre));
    } else if (cumpleRequisitos(materia, aprobadas, materiaPorNombre)) {
      setAprobadas([...aprobadas, materia.nombre]);
    }
  }

  return (
    <div>
      <h1 className="titulo-malla">Malla Interactiva Contador Público</h1>
      <div className="malla-grid">
        {semestres.map((semestre) => (
          <div key={semestre} className="semestre-col">
            <div className="semestre-header" style={{ background: color }}>
              {`Semestre ${semestre}`}
            </div>
            {getMateriasPorSemestre(materias, semestre).map((materia) => {
              const aprobada = aprobadas.includes(materia.nombre);
              const desbloqueada = cumpleRequisitos(materia, aprobadas, materiaPorNombre);
              return (
                <div
                  key={materia.nombre}
                  className={`materia-card${aprobada ? " aprobada" : ""}${desbloqueada ? " desbloqueada" : " bloqueada"}${materia.opcional ? " opcional" : ""}`}
                  onClick={() => handleMateriaClick(materia)}
                  title={`Área: ${materia.area}\nCréditos: ${materia.creditos}\nRequisitos: ${materia.requisitos.length ? materia.requisitos.join(", ") : "Ninguno"}`}
                >
                  <div className="materia-nombre">{materia.nombre}</div>
                  <div className="materia-area">{materia.area}</div>
                  <div className="materia-creditos">{materia.creditos} créditos</div>
                  {materia.requisitos.length > 0 && (
                    <div className="materia-requisitos">
                      <span>Requisitos:</span>
                      <ul>
                        {materia.requisitos.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <button className="btn-reset" onClick={() => setAprobadas([])}>
        Reiniciar progreso
      </button>
    </div>
  );
}
