import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import { Plus, Check, Ban, Play, Lock } from "lucide-react";
import * as complianceApi from "../../api/complianceApi";
import { useRole } from "../../hooks/useRole";
import { formatDateTime, labelify } from "../../utils/formatters";
import { AUDIT_STATUSES } from "../../utils/constants";
import { toast } from "sonner";

// Helper: return the next status in the lifecycle, or null if there is no next step.
// Lifecycle: PLANNED → IN_PROGRESS → COMPLETED. CANCELLED is a separate terminal state.
function getNextStatus(currentStatus) {
  if (currentStatus === "PLANNED") return "IN_PROGRESS";
  if (currentStatus === "IN_PROGRESS") return "COMPLETED";
  return null;
}

// Helper: returns true when the audit cannot be edited anymore.
function isLocked(status) {
  if (status === "COMPLETED") return true;
  if (status === "CANCELLED") return true;
  return false;
}

// Helper: returns a human-readable label for a status.
function getStatusLabel(status) {
  if (status === "PLANNED") return "Planned";
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "COMPLETED") return "Completed";
  return status;
}

// Helper: returns the label for the "advance to next status" button.
function getNextButtonLabel(nextStatus) {
  if (nextStatus === "IN_PROGRESS") return "Start Progress";
  if (nextStatus === "COMPLETED") return "Mark Completed";
  return "";
}

// Helper: returns the progress bar percentage for a given status.
function getProgressPercent(status) {
  if (status === "CANCELLED") return 100;
  if (status === "PLANNED") return 0;
  if (status === "IN_PROGRESS") return 50;
  if (status === "COMPLETED") return 100;
  return 0;
}

export default function AuditsPage() {
  const { canManageCompliance } = useRole();
  // List of audits
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Loading flags for write operations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Status filter
  const [statusFilter, setStatusFilter] = useState("");

  // Create modal state — one useState per form field
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [officerId, setOfficerId] = useState("");
  const [scope, setScope] = useState("");
  const [findings, setFindings] = useState("");

  // Update modal state — the record being edited and its form fields
  const [updateRecord, setUpdateRecord] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("PLANNED");
  const [updateFindings, setUpdateFindings] = useState("");

  // The three forward steps shown in the progress bar
  const lifecycleSteps = ["PLANNED", "IN_PROGRESS", "COMPLETED"];

  // Fetch audits when the page first loads
  useEffect(() => {
    fetchAudits();
  }, []);

  async function fetchAudits() {
    setIsLoading(true);
    try {
      const response = await complianceApi.getAudits();
      setAudits(response.data);
    } catch (error) {
      setAudits([]);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setOfficerId("");
    setScope("");
    setFindings("");
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setOfficerId("");
    setScope("");
    setFindings("");
  }

  function openUpdateModal(record) {
    setUpdateRecord(record);
    setUpdateStatus(record.status);
    setUpdateFindings(record.findings || "");
  }

  function closeUpdateModal() {
    setUpdateRecord(null);
  }

  // Filter audits by status if a filter is selected
  let filtered;
  if (statusFilter) {
    filtered = audits.filter((a) => a.status === statusFilter);
  } else {
    filtered = audits;
  }

  async function handleCreate() {
    setIsCreating(true);
    try {
      // The form shows the officer ID with an "AUD100" prefix.
      // Strip it before sending so the backend gets a plain number.
      let officerIdNumeric = officerId;
      if (officerIdNumeric.startsWith("AUD100")) {
        officerIdNumeric = officerIdNumeric.substring("AUD100".length);
      }
      const trimmedFindings = findings.trim();
      const payload = {
        officerId: parseInt(officerIdNumeric),
        scope: scope.trim(),
        findings: trimmedFindings ? trimmedFindings : null,
      };
      await complianceApi.createAudit(payload);
      toast.success("Audit created");
      closeCreateModal();
      fetchAudits();
    } catch (error) {
      let msg = "Failed to create audit";
      if (error.response && error.response.data) {
        if (error.response.data.message) msg = error.response.data.message;
        else if (error.response.data.error) msg = error.response.data.error;
      }
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate() {
    setIsUpdating(true);
    try {
      const findingsArg = updateFindings ? updateFindings : undefined;
      await complianceApi.updateAuditStatus(
        updateRecord.auditId,
        updateStatus,
        findingsArg,
      );
      toast.success("Audit updated");
      closeUpdateModal();
      fetchAudits();
    } catch (error) {
      let msg = "Failed to update audit";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        msg = error.response.data.message;
      }
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  }

  // Compute the numeric part of officerId for validation
  let officerIdForCheck = officerId;
  if (officerIdForCheck.startsWith("AUD100")) {
    officerIdForCheck = officerIdForCheck.substring("AUD100".length);
  }
  const isCreateDisabled =
    !officerIdForCheck || isNaN(parseInt(officerIdForCheck)) || !scope.trim();

  const columns = [
    {
      key: "auditId",
      label: "ID",
      render: (r) => <span className="text-xs text-bark-400">{r.auditId}</span>,
    },
    {
      key: "officerId",
      label: "Officer ID",
      render: (r) => <span className="text-xs font-medium">{r.officerId}</span>,
    },
    {
      key: "scope",
      label: "Scope",
      sortable: true,
      render: (r) => (
        <span className="text-xs max-w-[200px] truncate block">{r.scope}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "date",
      label: "Date",
      render: (r) => (
        <span className="text-xs text-bark-400">{formatDateTime(r.date)}</span>
      ),
    },
    {
      key: "findings",
      label: "Findings",
      render: (r) => (
        <span className="text-xs text-bark-400 truncate max-w-[150px] block">
          {r.findings || "—"}
        </span>
      ),
    },
    {
      label: "Actions",
      render: (r) => {
        if (!canManageCompliance) return null;
        const locked = isLocked(r.status);
        return (
          <Button
            size="sm"
            variant={locked ? "ghost" : "outline"}
            onClick={() => openUpdateModal(r)}
            title={locked ? "Audit is locked — view only" : "Update audit"}
          >
            {locked ? (
              <>
                <Lock size={12} /> View
              </>
            ) : (
              "Update"
            )}
          </Button>
        );
      },
    },
  ];

  // Render the body of the "Update Audit" modal.
  // Declared as a helper function so we can use plain if/else statements
  // and named local variables instead of putting it all inside JSX.
  function renderUpdateModalBody() {
    if (updateRecord === null) return null;

    // The status the audit currently has on the server
    const serverStatus = updateRecord.status;
    const locked = isLocked(serverStatus);
    const nextStatus = getNextStatus(serverStatus);

    // The status the user has selected in the form (preview)
    const previewStatus = updateStatus;
    const isCancelled = previewStatus === "CANCELLED";
    const isCompleted = previewStatus === "COMPLETED";
    const progressPct = getProgressPercent(previewStatus);

    // Has the user changed anything that we could save?
    const oldFindings = updateRecord.findings || "";
    const newFindings = updateFindings || "";
    const nothingChanged =
      updateStatus === updateRecord.status && oldFindings === newFindings;

    // Pick the bar color based on the preview status
    let barColor = "bg-forest-500";
    if (isCancelled) barColor = "bg-red-500";
    else if (isCompleted) barColor = "bg-forest-600";

    return (
      <div className="space-y-5">
        {/* === Progress Bar === */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-bark-700">Lifecycle</span>
            {isCancelled ? (
              <span className="text-xs font-semibold text-red-600 inline-flex items-center gap-1">
                <Ban size={12} /> Cancelled
              </span>
            ) : isCompleted ? (
              <span className="text-xs font-semibold text-forest-700 inline-flex items-center gap-1">
                <Check size={12} /> Completed
              </span>
            ) : (
              <span className="text-xs text-bark-500">
                {getStatusLabel(previewStatus)}
              </span>
            )}
          </div>

          {/* The track */}
          <div className="relative h-2 bg-bark-400/15 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Step labels with circular markers */}
          <div className="grid grid-cols-3 mt-3 text-center">
            {lifecycleSteps.map((step, i) => {
              const stepIndex = lifecycleSteps.indexOf(previewStatus);
              const reached = !isCancelled && stepIndex >= i;
              const isCurrent = !isCancelled && stepIndex === i;

              // Pick classes for the circle marker
              let circleClass = "border-bark-400/30 bg-white text-bark-400";
              if (isCancelled)
                circleClass = "border-red-300 bg-red-50 text-red-400";
              else if (reached)
                circleClass = "border-forest-600 bg-forest-600 text-white";

              // Pick classes for the label text
              let labelClass = "text-bark-500";
              if (isCancelled) labelClass = "text-red-400";
              else if (reached) labelClass = "text-forest-700";

              return (
                <div key={step} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${circleClass} ${isCurrent ? "ring-4 ring-forest-600/20" : ""}`}
                  >
                    {reached ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`text-[11px] font-medium ${labelClass}`}>
                    {getStatusLabel(step)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* === Lifecycle Action Buttons === */}
        {locked ? (
          <div
            className={`rounded-xl p-3 flex items-center gap-2 text-xs ${isCancelled ? "bg-red-50 text-red-700 border border-red-200" : "bg-forest-600/5 text-forest-700 border border-forest-600/20"}`}
          >
            <Lock size={14} />
            {isCancelled
              ? "This audit was cancelled and cannot be modified further."
              : "This audit is completed and the lifecycle is locked."}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nextStatus && (
              <Button
                onClick={() => setUpdateStatus(nextStatus)}
                disabled={updateStatus === nextStatus}
              >
                {nextStatus === "IN_PROGRESS" ? (
                  <Play size={14} />
                ) : (
                  <Check size={14} />
                )}
                {getNextButtonLabel(nextStatus)}
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => setUpdateStatus("CANCELLED")}
              disabled={updateStatus === "CANCELLED"}
            >
              <Ban size={14} /> Cancel Audit
            </Button>
            {updateStatus !== updateRecord.status && (
              <button
                type="button"
                onClick={() => setUpdateStatus(updateRecord.status)}
                className="text-xs text-bark-500 hover:text-bark-700 underline self-center"
              >
                Reset selection
              </button>
            )}
          </div>
        )}

        {/* === Findings === */}
        <div>
          <label className="block text-sm font-medium text-bark-600 mb-1">
            Findings{" "}
            {locked && (
              <span className="text-xs text-bark-400 font-normal">
                (read-only)
              </span>
            )}
          </label>
          <textarea
            rows={4}
            readOnly={locked}
            className={`w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 ${locked ? "bg-bark-50 cursor-not-allowed text-bark-600" : ""}`}
            value={updateFindings}
            onChange={(e) => setUpdateFindings(e.target.value)}
            placeholder="Audit findings…"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={closeUpdateModal}>
            {locked ? "Close" : "Cancel"}
          </Button>
          {!locked && (
            <Button
              onClick={handleUpdate}
              loading={isUpdating}
              disabled={nothingChanged}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        emoji="✅"
        title="Audits"
        description="Environmental compliance audits"
        action={
          <div className="flex gap-2 items-center">
            <select
              className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {AUDIT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelify(s)}
                </option>
              ))}
            </select>
            {canManageCompliance && (
              <Button onClick={openCreateModal}>
                <Plus size={16} /> Create Audit
              </Button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          searchPlaceholder="Search audits…"
        />
      </div>

      <Modal
        open={createModalOpen}
        onClose={closeCreateModal}
        title="Create Audit"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">
              Officer ID
            </label>
            <input
              type="text"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              placeholder="Enter officer ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">
              Scope
            </label>
            <input
              type="text"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Describe the audit scope…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">
              Initial Findings{" "}
              <span className="text-bark-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Initial findings or notes…"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={isCreating}
              disabled={isCreateDisabled}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={updateRecord !== null}
        onClose={closeUpdateModal}
        title="Update Audit"
        size="sm"
      >
        {renderUpdateModalBody()}
      </Modal>
    </DashboardLayout>
  );
}
