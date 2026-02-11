const HSL_PATTERN =
  /hsl\((\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\)/;

const SPANISH_DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function splitTickLabel(rawValue: string, maxLength = 14): string[] {
  const splitBySlash = rawValue.split("/").flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.length <= maxLength) {
      return [trimmed];
    }

    const words = trimmed.split(" ");
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      if (line && `${line} ${word}`.length > maxLength) {
        lines.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }

    if (line) {
      lines.push(line);
    }

    return lines;
  });

  return splitBySlash.length > 0 ? splitBySlash : [rawValue];
}

export async function svgToDataUrl(container: HTMLElement): Promise<string> {
  const svgElement = container.querySelector("svg");
  if (!svgElement) {
    throw new Error("No SVG found");
  }

  const bounds = svgElement.getBoundingClientRect();
  const scale = 3;
  const width = bounds.width * scale;
  const height = bounds.height * scale;

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute("width", String(width));
  clonedSvg.setAttribute("height", String(height));
  clonedSvg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);

  const originalTextNodes = svgElement.querySelectorAll("text, tspan");
  const clonedTextNodes = clonedSvg.querySelectorAll("text, tspan");

  originalTextNodes.forEach((node, index) => {
    const sourceStyles = globalThis.getComputedStyle(node);
    const targetNode = clonedTextNodes[index] as SVGElement | undefined;

    if (!targetNode) {
      return;
    }

    targetNode.setAttribute(
      "style",
      `font-family:${sourceStyles.fontFamily};font-size:${sourceStyles.fontSize};font-weight:${sourceStyles.fontWeight};fill:${sourceStyles.fill || sourceStyles.color}`,
    );
  });

  const backgroundRect = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect",
  );
  backgroundRect.setAttribute("width", "100%");
  backgroundRect.setAttribute("height", "100%");
  backgroundRect.setAttribute("fill", "#ffffff");
  clonedSvg.insertBefore(backgroundRect, clonedSvg.firstChild);

  const blob = new Blob([new XMLSerializer().serializeToString(clonedSvg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to get canvas 2D context"));
        return;
      }

      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };

    image.src = objectUrl;
  });
}

export function hslToRgb(hsl: string): { r: number; g: number; b: number } {
  const match = HSL_PATTERN.exec(hsl);
  if (!match) {
    return { r: 100, g: 100, b: 100 };
  }

  const hue = Number.parseFloat(match[1]) / 360;
  const saturation = Number.parseFloat(match[2]) / 100;
  const lightness = Number.parseFloat(match[3]) / 100;

  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let red = lightness;
  let green = lightness;
  let blue = lightness;

  if (saturation !== 0) {
    const q =
      lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;

    red = hueToRgb(p, q, hue + 1 / 3);
    green = hueToRgb(p, q, hue);
    blue = hueToRgb(p, q, hue - 1 / 3);
  }

  return {
    r: Math.round(red * 255),
    g: Math.round(green * 255),
    b: Math.round(blue * 255),
  };
}

export function formatSpanishDate(date = new Date()): string {
  return SPANISH_DATE_FORMATTER.format(date);
}

export function createPdfFilename(name: string): string {
  const normalizedName = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9-]/g, "");

  return `rueda-vida-${normalizedName || "coachee"}.pdf`;
}
