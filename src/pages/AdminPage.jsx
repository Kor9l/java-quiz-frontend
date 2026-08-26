import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../AppContext";

export default function AdminPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  async function reload() {
    setRows(await api.get("/api/admin/users"));
  }

  useEffect(() => {
    reload().catch(() => setRows([]));
  }, []);

  async function changeRole(id, role) {
    await api.patch(`/api/admin/users/${id}/role`, { role });
    await reload();
  }

  return (
    <div className="page">
      <div className="row between header-bar">
        <h1>{t("admin.title")}</h1>
        <button className="btn" onClick={() => navigate("/")}>{t("common.back")}</button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>{t("auth.email")}</th>
              <th>{t("auth.displayName")}</th>
              <th>{t("admin.role")}</th>
              <th>{t("admin.provider")}</th>
              <th>{t("stats.answered")}</th>
              <th>{t("admin.created")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.user.id}>
                <td>{row.user.email}</td>
                <td>{row.user.displayName}</td>
                <td>
                  <select className="select" value={row.user.role} onChange={(e) => changeRole(row.user.id, e.target.value)}>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td>{row.authProvider}</td>
                <td>{row.totalAnswered}</td>
                <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
