import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import styles from "./HorarioFixoForm.module.css";

const DIAS = [
  { value: "SEGUNDA", label: "Segunda" },
  { value: "TERCA", label: "Terça" },
  { value: "QUARTA", label: "Quarta" },
  { value: "QUINTA", label: "Quinta" },
  { value: "SEXTA", label: "Sexta" },
  { value: "SABADO", label: "Sábado" },
];

export default function HorarioFixoForm({ pessoaId, tipo, onSave }) {
  const [horarios, setHorarios] = useState(
    DIAS.map((d) => ({ dia_semana: d.value, hora_entrada: "", hora_saida: "" }))
  );
  const [usarHorarioFixo, setUsarHorarioFixo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showUsarHorarioFixo = tipo === "PROFADM";

  useEffect(() => {
    if (!pessoaId) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get(`/pessoas/${pessoaId}/horario-fixo`);
        if (cancelled) return;
        if (res.horarios?.length) {
          const byDia = {};
          res.horarios.forEach((h) => {
            byDia[h.dia_semana] = h;
          });
          setHorarios(
            DIAS.map((d) => ({
              dia_semana: d.value,
              hora_entrada: byDia[d.value]?.hora_entrada || "",
              hora_saida: byDia[d.value]?.hora_saida || "",
            }))
          );
        }
        setUsarHorarioFixo(!!res.usar_horario_fixo);
      } catch (e) {
        if (!cancelled) setHorarios(DIAS.map((d) => ({ dia_semana: d.value, hora_entrada: "", hora_saida: "" })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pessoaId]);

  const handleChange = (dia, field, value) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.dia_semana === dia ? { ...h, [field]: value } : h
      )
    );
  };

  const handleSalvar = async () => {
    setSaving(true);
    try {
      await api.put(`/pessoas/${pessoaId}/horario-fixo`, {
        horarios: horarios.filter((h) => h.hora_entrada && h.hora_saida),
        usar_horario_fixo: showUsarHorarioFixo ? usarHorarioFixo : undefined,
      });
      onSave?.();
    } catch (e) {
      console.error("Erro ao salvar horário:", e);
      alert(e?.message || "Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando horários...</div>;

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Horário fixo (entrada/saída por dia)</h4>
      {showUsarHorarioFixo && (
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={usarHorarioFixo}
            onChange={(e) => setUsarHorarioFixo(e.target.checked)}
          />
          Usar horário fixo (em vez do horário das aulas)
        </label>
      )}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Dia</th>
              <th>Entrada</th>
              <th>Saída</th>
            </tr>
          </thead>
          <tbody>
            {horarios.map((h) => (
              <tr key={h.dia_semana}>
                <td>{DIAS.find((d) => d.value === h.dia_semana)?.label}</td>
                <td>
                  <input
                    type="time"
                    value={h.hora_entrada}
                    onChange={(e) =>
                      handleChange(h.dia_semana, "hora_entrada", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={h.hora_saida}
                    onChange={(e) =>
                      handleChange(h.dia_semana, "hora_saida", e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className={styles.saveBtn}
        onClick={handleSalvar}
        disabled={saving}
      >
        {saving ? "Salvando..." : "Salvar horários"}
      </button>
    </div>
  );
}
