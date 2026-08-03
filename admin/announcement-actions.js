(function () {
  const data = window.churchAdminAnnouncementData;
  let parsedAnnouncement = null;

  function setStatus(message) {
    const status = document.querySelector("[data-action-status]");

    if (status) {
      status.textContent = message;
    }
  }

  function setEmailStatus(message) {
    const status = document.querySelector("[data-email-status]");

    if (status) {
      status.textContent = message;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);

    if (node) {
      node.textContent = value || "";
    }
  }

  function setValue(selector, value) {
    const node = document.querySelector(selector);

    if (node) {
      node.value = value || "";
    }
  }

  function getValue(selector) {
    const node = document.querySelector(selector);

    return node ? node.value.trim() : "";
  }

  function getAnnouncementLines() {
    return (parsedAnnouncement?.announcements || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function splitAnnouncementLines() {
    const lines = getAnnouncementLines();
    const closingIndex = lines.findIndex((line) => /^with prayers,?$/i.test(line));

    if (closingIndex < 0) {
      return {
        bullets: lines,
        closing: []
      };
    }

    return {
      bullets: lines.slice(0, closingIndex),
      closing: lines.slice(closingIndex)
    };
  }

  function getBulletAnnouncements() {
    const parts = splitAnnouncementLines();
    const bullets = parts.bullets.map((line) => `• ${formatBulletForCopy(line)}`).join("\n\n");
    const closing = parts.closing.join("\n");

    return [bullets, closing].filter(Boolean).join("\n\n");
  }

  function getCaptionForCopy() {
    if (!parsedAnnouncement) {
      return "";
    }

    const lines = parsedAnnouncement.caption
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line && line !== parsedAnnouncement.title);
    const praiseLine = lines.find((line) => /^praise be to jesus christ/i.test(line));
    const introLine = lines.find((line) => /^please find below/i.test(line));
    const otherLines = lines.filter((line) => line !== praiseLine && line !== introLine);

    return [
      praiseLine,
      parsedAnnouncement.title,
      introLine,
      ...otherLines
    ].filter(Boolean).join("\n\n");
  }

  function splitBulletTitle(line) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex < 0) {
      return {
        title: line,
        body: ""
      };
    }

    return {
      title: line.slice(0, separatorIndex + 1),
      body: line.slice(separatorIndex + 1).trim()
    };
  }

  function formatBulletForCopy(line) {
    const parts = splitBulletTitle(line);

    if (!parts.body) {
      return `*${parts.title}*`;
    }

    return `*${parts.title}* ${parts.body}`;
  }

  function getActivityHtml(activity) {
    const lines = activity.split(/\n+/).map((line) => line.trim()).filter(Boolean);

    if (lines.length === 1 && /^N\/A$/i.test(lines[0])) {
      return "N/A";
    }

    const mergedLines = [];

    lines.forEach((line) => {
      if (/^followed by\b/i.test(line) && mergedLines.length) {
        mergedLines[mergedLines.length - 1] = `${mergedLines[mergedLines.length - 1]} ${line}`;
      } else {
        mergedLines.push(line);
      }
    });

    return `<ul style="margin:0;padding-left:12px;">${mergedLines.map((line) => `<li style="margin:0;line-height:1.2;">${escapeHtml(line)}</li>`).join("")}</ul>`;
  }

  function getDayHtml(day) {
    const lines = day.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const [weekday, ...details] = lines;

    return [
      weekday ? `<div style="font-weight:700;line-height:1.15;">${escapeHtml(weekday)}</div>` : "",
      ...details.map((detail) => `<div style="font-weight:800;line-height:1.15;margin-top:1px;">${escapeHtml(detail)}</div>`)
    ].join("");
  }

  function renderFinalAnnouncements() {
    const container = document.querySelector("[data-final-announcements]");

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const parts = splitAnnouncementLines();

    if (!parts.bullets.length && !parts.closing.length) {
      container.textContent = "No final announcements found.";
      return;
    }

    if (parts.bullets.length) {
      const list = document.createElement("ul");
      list.className = "message-bullet-list";

      parts.bullets.forEach((line) => {
        const parts = splitBulletTitle(line);
        const item = document.createElement("li");
        const title = document.createElement("strong");

        title.textContent = parts.title;
        item.appendChild(title);

        if (parts.body) {
          item.append(` ${parts.body}`);
        }

        list.appendChild(item);
      });

      container.appendChild(list);
    }

    if (parts.closing.length) {
      const closing = document.createElement("div");
      closing.className = "message-closing";
      closing.textContent = parts.closing.join("\n");
      container.appendChild(closing);
    }
  }

  function getEmailHtml() {
    const captionLines = parsedAnnouncement.caption
      .split(/\n+/)
      .filter((line) => line && line !== parsedAnnouncement.title);
    const parts = splitAnnouncementLines();
    const scheduleRows = parsedAnnouncement.scheduleRows.map((row) => `
      <tr>
        <td style="border:1px solid #c8d7ea;padding:6px 7px;text-align:center;vertical-align:middle;font-size:11px;font-weight:700;color:#10233f;width:16%;">${escapeHtml(row.date)}</td>
        <td style="border:1px solid #c8d7ea;padding:6px 7px;text-align:center;vertical-align:middle;font-size:11px;color:#10233f;width:22%;">${getDayHtml(row.day)}</td>
        <td style="border:1px solid #c8d7ea;padding:6px 8px;text-align:left;vertical-align:middle;font-size:11px;line-height:1.2;color:#10233f;width:62%;">${getActivityHtml(row.activity)}</td>
      </tr>
    `).join("");
    const announcementItems = parts.bullets.map((line) => {
      const bullet = splitBulletTitle(line);
      return `<li style="margin:0 0 14px;padding-left:3px;"><strong>${escapeHtml(bullet.title)}</strong>${bullet.body ? ` ${escapeHtml(bullet.body)}` : ""}</li>`;
    }).join("");
    const closing = parts.closing.length
      ? `<p style="margin:22px 0 0;white-space:pre-line;">${escapeHtml(parts.closing.join("\n"))}</p>`
      : "";

    return `
      <div style="max-width:720px;margin:0 auto;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#10233f;">
        <div style="background:#ffffff;border:1px solid #d8e3f0;border-bottom:0;padding:12px 18px;">
          <img src="https://stmarysyroclt.org/images/navbarImage.png" alt="St. Mary's Syro-Malabar Catholic Church" style="display:block;width:100%;height:auto;border:0;">
        </div>
        <div style="background:#e6f3ff;border-left:1px solid #d8e3f0;border-right:1px solid #d8e3f0;padding:28px 26px 24px;">
          <h1 style="font-size:25px;line-height:1.2;margin:0 0 12px;font-weight:800;color:#10233f;">${escapeHtml(parsedAnnouncement.title)}</h1>
          <p style="font-size:16px;line-height:1.4;margin:0;color:#416996;">Church Services &amp; Parish Announcements</p>
        </div>
        <div style="background:#ffffff;border:1px solid #d8e3f0;border-top:0;padding:24px 26px 34px;">
          ${captionLines.map((line) => `<p style="font-size:16px;line-height:1.45;margin:0 0 20px;font-weight:400;color:#10233f;">${escapeHtml(line)}</p>`).join("")}
          <table style="border-collapse:collapse;width:100%;margin:22px auto 28px;background:#ffffff;font-size:11px;table-layout:fixed;">
            <colgroup>
              <col style="width:16%;">
              <col style="width:22%;">
              <col style="width:62%;">
            </colgroup>
            <thead>
              <tr>
                <th colspan="3" style="border:1px solid #9eb9d8;background:#e6f3ff;color:#10233f;padding:8px 9px;text-align:left;font-size:14px;font-weight:800;">Weekly Schedule</th>
              </tr>
              <tr>
                <th style="border:1px solid #163f73;background:#173f73;color:#ffffff;padding:7px;text-align:center;font-size:11px;width:16%;">Date</th>
                <th style="border:1px solid #163f73;background:#173f73;color:#ffffff;padding:7px;text-align:center;font-size:11px;width:22%;">Day</th>
                <th style="border:1px solid #163f73;background:#173f73;color:#ffffff;padding:7px;text-align:center;font-size:11px;width:62%;">Church Services &amp; Activities</th>
              </tr>
            </thead>
            <tbody>${scheduleRows}</tbody>
          </table>
          <div style="text-align:left;font-size:14px;line-height:1.55;margin-top:12px;color:#10233f;">
            <h2 style="font-size:20px;line-height:1.25;margin:0 0 16px;font-weight:800;color:#10233f;">Announcements</h2>
            <ul style="margin:0;padding-left:20px;">${announcementItems}</ul>
            ${closing}
          </div>
        </div>
      </div>
    `;
  }

  function renderEmailHtmlPreview() {
    const preview = document.querySelector("[data-email-html-preview]");

    if (preview && parsedAnnouncement) {
      preview.innerHTML = getEmailHtml();
    }
  }

  function renderPreview() {
    if (!data) {
      return;
    }

    const savedText = data.getSavedText();

    if (!savedText.trim()) {
      window.location.replace("new-announcement.html");
      return;
    }

    parsedAnnouncement = data.parseAnnouncementText(savedText);

    setText("[data-announcement-title]", parsedAnnouncement.title);
    setText("[data-announcement-date]", parsedAnnouncement.dateLabel);
    setText("[data-final-caption]", parsedAnnouncement.caption);
    renderFinalAnnouncements();
    setValue("[data-email-subject]", parsedAnnouncement.title);
    setValue("[data-email-preview]", `${parsedAnnouncement.caption}\n\n${getBulletAnnouncements()}`.trim());
    renderEmailHtmlPreview();

    const scheduleBody = document.querySelector("[data-schedule-body]");

    if (scheduleBody) {
      scheduleBody.innerHTML = "";

      if (!parsedAnnouncement.scheduleRows.length) {
        const tableRow = document.createElement("tr");
        const tableCell = document.createElement("td");

        tableCell.colSpan = 3;
        tableCell.textContent = "No schedule rows found. Go back and paste the Google Docs announcement, then preview again.";
        tableRow.appendChild(tableCell);
        scheduleBody.appendChild(tableRow);
        setStatus("Schedule rows were not found in the pasted text.");
        return;
      }

      parsedAnnouncement.scheduleRows.forEach((row) => {
        const tableRow = document.createElement("tr");
        const dateCell = document.createElement("td");
        const dayCell = document.createElement("td");
        const activityCell = document.createElement("td");

        dateCell.textContent = row.date;
        dayCell.innerHTML = getDayHtml(row.day);
        activityCell.innerHTML = getActivityHtml(row.activity);

        tableRow.append(dateCell, dayCell, activityCell);
        scheduleBody.appendChild(tableRow);
      });
    }
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/);
    let line = "";
    let currentY = y;

    words.forEach((word) => {
      const nextLine = line ? `${line} ${word}` : word;

      if (context.measureText(nextLine).width > maxWidth && line) {
        context.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = nextLine;
      }
    });

    if (line) {
      context.fillText(line, x, currentY);
      currentY += lineHeight;
    }

    return currentY;
  }

  function getWrappedLineCount(context, text, maxWidth) {
    const words = text.split(/\s+/);
    let line = "";
    let count = 1;

    words.forEach((word) => {
      const nextLine = line ? `${line} ${word}` : word;

      if (context.measureText(nextLine).width > maxWidth && line) {
        line = word;
        count += 1;
      } else {
        line = nextLine;
      }
    });

    return count;
  }

  function getMergedActivityLines(activity) {
    const lines = activity.split(/\n+/).map((line) => line.trim()).filter(Boolean);

    if (lines.length === 1 && /^N\/A$/i.test(lines[0])) {
      return ["N/A"];
    }

    const mergedLines = [];

    lines.forEach((line) => {
      if (/^followed by\b/i.test(line) && mergedLines.length) {
        mergedLines[mergedLines.length - 1] = `${mergedLines[mergedLines.length - 1]} ${line}`;
      } else {
        mergedLines.push(line);
      }
    });

    return mergedLines.map((line) => `• ${line}`);
  }

  function loadCanvasImage(src) {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function drawContainImage(context, image, x, y, width, height) {
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = x;
    const drawY = y + (height - drawHeight) / 2;

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  async function renderScheduleTableToCanvas() {
    const rows = parsedAnnouncement.scheduleRows.map((row) => ({
      date: row.date,
      dayLines: row.day.split(/\n+/).map((line) => line.trim()).filter(Boolean),
      activityLines: getMergedActivityLines(row.activity)
    }));
    const scale = 2;
    const width = 1280;
    const margin = 44;
    const tableWidth = width - margin * 2;
    const columns = [150, 230, tableWidth - 150 - 230];
    const tableX = margin;
    const headerImageHeight = 118;
    const dividerGap = 12;
    const titleHeight = 46;
    const columnHeaderHeight = 52;
    const footerPadding = 40;
    const cellPaddingX = 14;
    const gridColor = "#c8d7ea";
    const darkBlue = "#173f73";
    const measuringCanvas = document.createElement("canvas");
    const measuringContext = measuringCanvas.getContext("2d");
    const headerImage = await loadCanvasImage("../images/navbarImage.png");

    measuringContext.font = "700 21px Arial";

    const bodyHeights = rows.map((row) => {
      measuringContext.font = "700 21px Arial";
      const dayLines = row.dayLines.reduce((count, line) => count + getWrappedLineCount(measuringContext, line, columns[1] - cellPaddingX * 2), 0);
      measuringContext.font = "500 21px Arial";
      const activityLines = row.activityLines.reduce((count, line) => count + getWrappedLineCount(measuringContext, line, columns[2] - cellPaddingX * 2), 0);
      const maxLines = Math.max(1, dayLines, activityLines);

      return Math.max(68, maxLines * 26 + 20);
    });

    const tableHeight = titleHeight + columnHeaderHeight + bodyHeights.reduce((total, rowHeight) => total + rowHeight, 0);
    const height = margin + headerImageHeight + dividerGap + tableHeight + footerPadding;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(scale, scale);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    if (headerImage) {
      drawContainImage(context, headerImage, margin, 22, tableWidth, headerImageHeight);
    }

    context.strokeStyle = gridColor;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(margin, margin + headerImageHeight - 2);
    context.lineTo(width - margin, margin + headerImageHeight - 2);
    context.stroke();

    let y = margin + headerImageHeight + dividerGap - 6;

    context.fillStyle = "#e6f3ff";
    context.fillRect(tableX, y, tableWidth, titleHeight);
    context.strokeStyle = "#9eb9d8";
    context.strokeRect(tableX, y, tableWidth, titleHeight);
    context.fillStyle = "#10233f";
    context.font = "800 25px Arial";
    context.textBaseline = "middle";
    context.fillText(parsedAnnouncement.title, tableX + 16, y + titleHeight / 2);

    y += titleHeight;

    context.fillStyle = darkBlue;
    context.fillRect(tableX, y, tableWidth, columnHeaderHeight);

    let x = tableX;
    ["Date", "Day", "Church Services & Activities"].forEach((cell, index) => {
      context.strokeStyle = "#5c7fa8";
      context.strokeRect(x, y, columns[index], columnHeaderHeight);
      context.fillStyle = "#ffffff";
      context.font = "800 24px Arial";
      context.textBaseline = "middle";
      context.fillText(cell, x + 16, y + columnHeaderHeight / 2);
      x += columns[index];
    });

    y += columnHeaderHeight;

    rows.forEach((row, rowIndex) => {
      const rowHeight = bodyHeights[rowIndex];

      context.fillStyle = rowIndex % 2 === 0 ? "#ffffff" : "#f5f8fc";
      context.fillRect(tableX, y, tableWidth, rowHeight);

      x = tableX;
      columns.forEach((columnWidth) => {
        context.strokeStyle = gridColor;
        context.strokeRect(x, y, columnWidth, rowHeight);
        x += columnWidth;
      });

      context.fillStyle = "#10233f";
      context.font = "800 21px Arial";
      context.textBaseline = "top";
      context.fillText(row.date, tableX + cellPaddingX, y + (rowHeight - 25) / 2);

      context.font = "800 21px Arial";
      const dayLineCount = row.dayLines.reduce((count, line) => count + getWrappedLineCount(context, line, columns[1] - cellPaddingX * 2), 0);
      const dayTextHeight = dayLineCount * 25;
      let textY = y + (rowHeight - dayTextHeight) / 2;
      row.dayLines.forEach((line) => {
        textY = drawWrappedText(context, line, tableX + columns[0] + cellPaddingX, textY, columns[1] - cellPaddingX * 2, 25);
      });

      context.font = "500 21px Arial";
      const activityLineCount = row.activityLines.reduce((count, line) => count + getWrappedLineCount(context, line, columns[2] - cellPaddingX * 2), 0);
      textY = y + (rowHeight - activityLineCount * 25) / 2;
      row.activityLines.forEach((line) => {
        textY = drawWrappedText(context, line, tableX + columns[0] + columns[1] + cellPaddingX, textY, columns[2] - cellPaddingX * 2, 25);
      });

      y += rowHeight;
    });

    return canvas;
  }

  async function copySchedulePng() {
    const table = document.querySelector("[data-schedule-table]");

    if (!table) {
      setStatus("Schedule table not found.");
      return;
    }

    if (!navigator.clipboard || !window.ClipboardItem) {
      setStatus("PNG copy is not supported in this browser.");
      return;
    }

    const canvas = await renderScheduleTableToCanvas(table);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!blob) {
      setStatus("Could not create PNG.");
      return;
    }

    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus("Schedule PNG copied.");
  }

  async function copyTextPart(part) {
    if (!navigator.clipboard) {
      setStatus("Text copy is not supported in this browser.");
      return;
    }

    const text = part === "announcements"
      ? getBulletAnnouncements()
      : getCaptionForCopy();

    if (!text) {
      setStatus("Nothing to copy.");
      return;
    }

    await navigator.clipboard.writeText(text);
    setStatus(part === "announcements" ? "Final announcements copied." : "Final caption copied.");
  }

  async function copyHtmlEmail() {
    if (!parsedAnnouncement) {
      setEmailStatus("Email is not ready.");
      return false;
    }

    const html = getEmailHtml();
    const plainText = `${parsedAnnouncement.caption}\n\n${getBulletAnnouncements()}`.trim();

    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" })
        })
      ]);
      setEmailStatus("HTML email copied. Paste it into Gmail.");
      return true;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(plainText);
      setEmailStatus("Plain text email copied. HTML copy is not supported in this browser.");
      return true;
    }

    setEmailStatus("Clipboard copy is not supported in this browser.");
    return false;
  }

  function getPlainEmailBody() {
    return `${parsedAnnouncement.caption}\n\n${getBulletAnnouncements()}`.trim();
  }

  function createGmailDraft() {
    const draftConfig = window.churchAdminGmailDraft || {};

    if (!draftConfig.endpoint) {
      setEmailStatus("Gmail draft endpoint is not configured. HTML email copied instead.");
      return copyHtmlEmail();
    }

    const gmailWindow = window.open("", "_blank");
    const iframe = document.createElement("iframe");
    const form = document.createElement("form");
    const fields = {
      to: getValue("[data-email-recipients]"),
      bcc: getValue("[data-email-bcc]"),
      subject: getValue("[data-email-subject]") || parsedAnnouncement.title,
      plainBody: getPlainEmailBody(),
      htmlBody: getEmailHtml()
    };

    if (gmailWindow) {
      gmailWindow.document.write("<!doctype html><title>Creating Gmail Draft</title><p style=\"font:16px Arial,sans-serif;padding:24px;\">Creating Gmail draft...</p>");
      gmailWindow.document.close();
    }

    iframe.name = "gmail-draft-submit";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    form.method = "POST";
    form.action = draftConfig.endpoint;
    form.target = iframe.name;
    form.style.display = "none";

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();

    window.setTimeout(() => {
      iframe.remove();

      if (gmailWindow) {
        gmailWindow.location.href = draftConfig.draftsUrl;
      } else {
        window.open(draftConfig.draftsUrl, "_blank");
      }
    }, 2500);

    setEmailStatus("Gmail draft request sent. Opening Gmail drafts...");
    return true;
  }

  function escapePdfText(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  function createPdfBlob() {
    const lines = [
      "St. Mary's Syro-Malabar Catholic Church",
      parsedAnnouncement.title,
      parsedAnnouncement.dateLabel,
      "",
      "Date | Day | Church Services & Activities",
      ...parsedAnnouncement.scheduleRows.map((row) => `${row.date} | ${row.day} | ${row.activity.replace(/\n/g, " / ")}`),
      "",
      "Announcements",
      getBulletAnnouncements() || "No additional announcements."
    ];
    const contentLines = ["BT", "/F1 12 Tf", "50 760 Td", "16 TL"];

    lines.forEach((line, index) => {
      if (index === 1) {
        contentLines.push("/F1 16 Tf");
      } else if (index === 2) {
        contentLines.push("/F1 12 Tf");
      }

      contentLines.push(`(${escapePdfText(line)}) Tj`);
      contentLines.push("T*");
    });

    contentLines.push("ET");

    const stream = contentLines.join("\n");
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
      "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
      `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((object) => {
      offsets.push(pdf.length);
      pdf += object;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  }

  function getPdfFileName() {
    return `${parsedAnnouncement.title.replace(/[^\w\s().-]/g, "").replace(/\s+/g, " ").trim() || "Weekly Schedule"}.pdf`;
  }

  async function exportPdf() {
    if (!parsedAnnouncement) {
      setStatus("Announcement is not ready.");
      return;
    }

    const blob = createPdfBlob();
    const fileName = getPdfFileName();

    if (window.showDirectoryPicker) {
      try {
        const directory = await window.showDirectoryPicker();
        const fileHandle = await directory.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        setStatus(`PDF saved as ${fileName}. Choose the repo bulletins folder.`);
        return;
      } catch (error) {
        if (error.name === "AbortError") {
          setStatus("PDF save canceled.");
          return;
        }
      }
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus(`PDF downloaded as ${fileName}. Move it into the bulletins folder.`);
  }

  document.querySelectorAll("[data-copy-schedule-png]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      setStatus("Copying PNG...");

      try {
        await copySchedulePng();
      } catch {
        setStatus("Browser blocked clipboard access. Use HTTPS or localhost.");
      }
    });
  });

  document.querySelectorAll("[data-copy-text]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        await copyTextPart(button.dataset.copyText);
      } catch {
        setStatus("Browser blocked clipboard access. Use HTTPS or localhost.");
      }
    });
  });

  document.querySelectorAll("[data-export-pdf]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      setStatus("Preparing PDF...");
      await exportPdf();
    });
  });

  document.querySelectorAll("[data-copy-html-email]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        await copyHtmlEmail();
      } catch {
        setEmailStatus("Browser blocked clipboard access. Use HTTPS or localhost.");
      }
    });
  });

  document.querySelectorAll("[data-preview-gmail]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      if (!parsedAnnouncement) {
        setEmailStatus("Email is not ready.");
        return;
      }

      try {
        await createGmailDraft();
      } catch {
        setEmailStatus("Could not create Gmail draft. Use Copy HTML Email and paste manually.");
      }
    });
  });

  renderPreview();
})();
