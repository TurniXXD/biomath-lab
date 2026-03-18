export type PdbAtom = {
  serial: number;
  atomName: string;
  residueName: string;
  chainId: string;
  residueSeq: number;
  x: number;
  y: number;
  z: number;
  element: string;
  recordName: "ATOM" | "HETATM";
};

export type PdbStructure = {
  atoms: PdbAtom[];
  chains: string[];
  residues: number;
  center: [number, number, number];
  radius: number;
};

const inferElement = (atomName: string) => {
  const sanitized = atomName.replace(/[^A-Za-z]/g, "").toUpperCase();

  if (!sanitized) {
    return "C";
  }

  if (sanitized.startsWith("CL")) {
    return "CL";
  }

  if (sanitized.startsWith("BR")) {
    return "BR";
  }

  return sanitized[0];
};

const parseNumber = (value: string) => {
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

export const parsePdb = (source: string): PdbStructure => {
  const atoms: PdbAtom[] = [];
  const chains = new Set<string>();
  const residues = new Set<string>();

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const line of source.split(/\r?\n/)) {
    const recordName = line.slice(0, 6).trim();

    if (recordName !== "ATOM" && recordName !== "HETATM") {
      continue;
    }

    const x = parseNumber(line.slice(30, 38));
    const y = parseNumber(line.slice(38, 46));
    const z = parseNumber(line.slice(46, 54));

    if (x === null || y === null || z === null) {
      continue;
    }

    const serial = Number.parseInt(line.slice(6, 11).trim(), 10);
    const atomName = line.slice(12, 16).trim();
    const residueName = line.slice(17, 20).trim() || "UNK";
    const chainId = line.slice(21, 22).trim() || "_";
    const residueSeq = Number.parseInt(line.slice(22, 26).trim(), 10);
    const element = (line.slice(76, 78).trim() || inferElement(atomName)).toUpperCase();

    atoms.push({
      serial: Number.isFinite(serial) ? serial : atoms.length + 1,
      atomName,
      residueName,
      chainId,
      residueSeq: Number.isFinite(residueSeq) ? residueSeq : 0,
      x,
      y,
      z,
      element,
      recordName,
    });

    chains.add(chainId);
    residues.add(`${chainId}:${residueSeq}:${residueName}`);

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  if (atoms.length === 0) {
    throw new Error("No ATOM or HETATM records were found in this PDB file.");
  }

  const center: [number, number, number] = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  ];

  let radius = 1;

  for (const atom of atoms) {
    const dx = atom.x - center[0];
    const dy = atom.y - center[1];
    const dz = atom.z - center[2];
    radius = Math.max(radius, Math.sqrt(dx * dx + dy * dy + dz * dz));
  }

  return {
    atoms,
    chains: [...chains].sort(),
    residues: residues.size,
    center,
    radius,
  };
};
