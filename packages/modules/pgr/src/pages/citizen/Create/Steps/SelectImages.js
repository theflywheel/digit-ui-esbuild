import React, { useCallback, useEffect, useState } from "react";
import { Toast } from "@egovernments/digit-ui-react-components";
import { NairobiDropZone } from "@egovernments/digit-ui-components";

/**
 * Step 5 — Upload complaint photos.
 *
 * Phase 6 / R2-A rewrite. The old implementation rendered a
 * <FormStep>+<ImageUploadHandler>+<UploadImages> sandwich; the
 * Nairobi Figma (research/screens.json — "Complaint Filing / Step 5:
 * Upload Photos", Android - 95) shows a single dashed-outline drop zone
 * with a small thumbnail row below.
 *
 * The drop-zone surface is the new <NairobiDropZone> atom from R1-B.
 * Below it we render up to 3 thumbnails inline (mirroring
 * ImageUploadHandler's existing 3-photo cap — see UploadImages.js
 * `thumbnails.length < 3` logic). Delete affordance is preserved.
 *
 * The shell CTA replaces the per-step submit; bindPrimaryAction sends
 * `{ label, onClick: handleSubmit, disabled: false }` (the photos step
 * is optional — Skip and Next both lead to the same next route, so
 * disabled is always false). bindSecondaryAction wires the skip link.
 *
 * Business logic preserved exactly: payload is still
 * `{ uploadedImages: string[] }` of fileStoreIds. The upload pipeline
 * (Digit.UploadServices.Filestorage / Filefetch) is the same one
 * ImageUploadHandler used. We do NOT re-implement filestore HTTP — we
 * call the same Digit.UploadServices facade.
 */
const SelectImages = ({ t, config, onSelect, onSkip, value, bindPrimaryAction, bindSecondaryAction }) => {
  const tenantId = value?.city_complaint?.code;
  const submitBarLabel = config?.texts?.submitBarLabel || "CS_COMMON_NEXT";
  const skipLabel = config?.texts?.skipText || "CORE_COMMON_SKIP_CONTINUE";

  const [uploadedImages, setUploadedImages] = useState(() => {
    const { uploadedImages } = value;
    return uploadedImages ? uploadedImages : [];
  });
  // thumbnails: [{ key: fileStoreId, image: dataUrl }]
  const [thumbnails, setThumbnails] = useState([]);
  const [error, setError] = useState("");

  // Hydrate thumbnails from any pre-existing uploadedImages in session
  // (e.g. user navigated back into this step). Same call ImageUploadHandler.submit()
  // makes — keeps payload contract identical.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!uploadedImages || uploadedImages.length === 0) {
        setThumbnails([]);
        return;
      }
      try {
        const res = await Digit.UploadServices.Filefetch(uploadedImages, tenantId);
        if (cancelled) return;
        const keys = Object.keys(res?.data || {}).filter((k) => k !== "fileStoreIds");
        const newThumbs = keys.map((key) => ({
          key,
          // ImageUploadHandler historically split on "," and took index [2]
          // because Filefetch returns `<small>,<medium>,<large>`. Mirror it.
          image: (res.data[key] || "").split(",")[2] || res.data[key],
        }));
        setThumbnails(newThumbs);
      } catch (e) {
        if (!cancelled) setError(t ? t("ES_PGR_UPLOAD_ERROR") : "Failed to load uploaded photos");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImages?.length, tenantId]);

  const handleSubmit = () => {
    onSelect({ uploadedImages: uploadedImages?.length ? uploadedImages : null });
  };

  // Push CTA descriptor up to the shell.
  useEffect(() => {
    if (typeof bindPrimaryAction !== "function") return;
    bindPrimaryAction({
      label: t(submitBarLabel),
      onClick: handleSubmit,
      disabled: false,
    });
    return () => bindPrimaryAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImages, submitBarLabel, t]);

  useEffect(() => {
    if (typeof bindSecondaryAction !== "function") return;
    bindSecondaryAction({
      label: t(skipLabel),
      onClick: () => (typeof onSkip === "function" ? onSkip() : onSelect()),
    });
    return () => bindSecondaryAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipLabel, t]);

  const handleFiles = useCallback(
    async (fileList) => {
      if (!fileList || fileList.length === 0) return;
      setError("");
      const file = fileList[0];
      if (file.size > 2097152) {
        setError(t ? t("CS_FILE_TOO_LARGE") : "File is too large");
        return;
      }
      // Upload one at a time to mirror ImageUploadHandler.uploadImage.
      try {
        const response = await Digit.UploadServices.Filestorage("property-upload", file, tenantId);
        const newId = response?.data?.files?.[0]?.fileStoreId;
        if (!newId) return;
        setUploadedImages((prev) => [...(prev || []), newId]);
      } catch (e) {
        setError(t ? t("CS_FILE_UPLOAD_FAILED") : "Upload failed");
      }
    },
    [tenantId, t]
  );

  const handleDelete = (thumbKey) => {
    setUploadedImages((prev) => (prev || []).filter((id) => id !== thumbKey));
    setThumbnails((prev) => prev.filter((thumb) => thumb.key !== thumbKey));
  };

  const canAddMore = (uploadedImages?.length || 0) < 3;

  return (
    <div className="nairobi-create-step nairobi-create-step--photos">
      {error && <Toast error={true} label={error} onClose={() => setError("")} />}
      {canAddMore && (
        <NairobiDropZone
          onSelect={handleFiles}
          accept="image/*"
          multiple={false}
          ctaLabel={t ? t("CS_ADD_PHOTO") : "Add photos"}
          helperText={t ? t("CS_PHOTO_HELPER") : "PNG or JPG up to 2MB"}
        />
      )}
      {thumbnails.length > 0 && (
        <div
          role="list"
          aria-label="Uploaded photos"
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {thumbnails.map((thumb) => (
            <div
              key={thumb.key}
              role="listitem"
              style={{
                position: "relative",
                width: 96,
                height: 96,
                flex: "0 0 auto",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid var(--color-tertiary-border, #EDEDED)",
                background: "var(--color-grey-light, #FAFAFA)",
              }}
            >
              <img
                src={thumb.image}
                alt="uploaded thumbnail"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <button
                type="button"
                onClick={() => handleDelete(thumb.key)}
                aria-label="Remove photo"
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  border: "none",
                  background: "rgba(0,0,0,0.6)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectImages;
