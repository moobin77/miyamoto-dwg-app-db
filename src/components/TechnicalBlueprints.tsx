import React from 'react';
import { Drawing, DrawingVersion } from '../types';

interface BlueprintProps {
  drawing: Drawing;
  activeVersion: DrawingVersion;
  showDiff: boolean;
  theme: 'blueprint' | 'dark' | 'light';
  selectedDimId: string | null;
  onSelectDim?: (dimId: string) => void;
}

export const TechnicalBlueprint: React.FC<BlueprintProps> = ({
  drawing,
  activeVersion,
  showDiff,
  theme,
  selectedDimId,
  onSelectDim,
}) => {
  const isDark = theme === 'dark';
  const isBlueprint = theme === 'blueprint';

  // Palette colors based on technical mode
  const bgFill = isBlueprint ? '#0f2744' : isDark ? '#090d16' : '#ffffff';
  const gridStroke = isBlueprint ? 'rgba(56, 189, 248, 0.08)' : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
  const mainStroke = isBlueprint ? '#38bdf8' : isDark ? '#94a3b8' : '#0f172a';
  const dimStroke = isBlueprint ? '#93c5fd' : isDark ? '#64748b' : '#475569';
  const centerLineStroke = isBlueprint ? '#f43f5e' : '#e11d48';
  const hatchFill = isBlueprint ? 'rgba(56, 189, 248, 0.12)' : isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)';

  // Determine if active version is Rev C / Rev B / Rev A
  const ver = activeVersion.version;
  const isRevC = ver.includes('C') || ver.includes('3');
  const isRevB = ver.includes('B') || ver.includes('2');

  const svgType = activeVersion.svgType || 'flange';

  return (
    <svg
      id="technical-drawing-canvas-svg"
      viewBox="0 0 1000 700"
      className="w-full h-full select-none"
      style={{ backgroundColor: bgFill }}
    >
      <defs>
        {/* Grid pattern */}
        <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
          <path d="M 25 0 L 0 0 0 25" fill="none" stroke={gridStroke} strokeWidth="1" />
        </pattern>
        {/* Fine subgrid */}
        <pattern id="fine-grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#grid)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke={gridStroke} strokeWidth="1.5" />
        </pattern>
        {/* Section Hatch pattern */}
        <pattern id="section-hatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="12" stroke={dimStroke} strokeWidth="1" opacity="0.4" />
        </pattern>
        {/* Dimension Arrow Markers */}
        <marker id="dim-arrow-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 5 L 8 2 L 8 8 z" fill={dimStroke} />
        </marker>
        <marker id="dim-arrow-end" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 8 5 L 0 2 L 0 8 z" fill={dimStroke} />
        </marker>
        <marker id="leader-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 2 L 8 5 L 0 8 z" fill={mainStroke} />
        </marker>
      </defs>

      {/* Background Grids */}
      <rect width="1000" height="700" fill="url(#fine-grid)" />

      {/* ISO Drawing Frame & Margins */}
      <rect x="25" y="25" width="950" height="650" fill="none" stroke={mainStroke} strokeWidth="2" />
      <rect x="35" y="35" width="930" height="630" fill="none" stroke={mainStroke} strokeWidth="1" opacity="0.6" />

      {/* Zone Grid Reference Marks (A-D, 1-6) */}
      <g fill={dimStroke} fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity="0.7">
        <text x="500" y="20">TOP VIEW & SECTION A-A ZONE</text>
        <text x="18" y="100">A</text>
        <text x="18" y="250">B</text>
        <text x="18" y="400">C</text>
        <text x="18" y="550">D</text>
        <text x="100" y="18">1</text>
        <text x="300" y="18">2</text>
        <text x="500" y="18">3</text>
        <text x="700" y="18">4</text>
        <text x="900" y="18">5</text>
      </g>

      {/* DRAWING CONTENT BY TYPE */}
      {svgType === 'flange' && (
        <FlangeGeometry
          isRevC={isRevC}
          isRevB={isRevB}
          mainStroke={mainStroke}
          dimStroke={dimStroke}
          centerLineStroke={centerLineStroke}
          hatchFill={hatchFill}
          showDiff={showDiff}
          selectedDimId={selectedDimId}
          onSelectDim={onSelectDim}
        />
      )}

      {svgType === 'shaft' && (
        <ShaftGeometry
          drawing={drawing}
          isRevB={isRevB}
          mainStroke={mainStroke}
          dimStroke={dimStroke}
          centerLineStroke={centerLineStroke}
          hatchFill={hatchFill}
          showDiff={showDiff}
          selectedDimId={selectedDimId}
          onSelectDim={onSelectDim}
          isBlueprint={isBlueprint}
        />
      )}

      {svgType === 'manifold' && (
        <ManifoldGeometry
          isRevB={isRevB}
          mainStroke={mainStroke}
          dimStroke={dimStroke}
          centerLineStroke={centerLineStroke}
          hatchFill={hatchFill}
          showDiff={showDiff}
          selectedDimId={selectedDimId}
          onSelectDim={onSelectDim}
        />
      )}

      {svgType === 'bracket' && (
        <BracketGeometry
          mainStroke={mainStroke}
          dimStroke={dimStroke}
          centerLineStroke={centerLineStroke}
          hatchFill={hatchFill}
          showDiff={showDiff}
          selectedDimId={selectedDimId}
          onSelectDim={onSelectDim}
        />
      )}

      {/* Diff Highlights Overlay Balloons */}
      {showDiff && activeVersion.diffHighlights && activeVersion.diffHighlights.length > 0 && (
        <g id="diff-highlights-layer">
          {activeVersion.diffHighlights.map((diff, index) => (
            <g key={index} transform={`translate(${diff.x}, ${diff.y})`}>
              {/* Pulsing diff target box */}
              <rect
                x="-10"
                y="-10"
                width={diff.width || 100}
                height={diff.height || 50}
                fill={diff.type === 'added' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.2)'}
                stroke={diff.type === 'added' ? '#10b981' : '#f59e0b'}
                strokeWidth="2"
                strokeDasharray="4 2"
                rx="6"
              />
              {/* Revision cloud badge */}
              <g transform="translate(10, -15)">
                <rect
                  x="-6"
                  y="-14"
                  width="130"
                  height="22"
                  rx="11"
                  fill={diff.type === 'added' ? '#059669' : '#d97706'}
                />
                <text
                  x="60"
                  y="1"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="IBM Plex Sans Thai, sans-serif"
                  textAnchor="middle"
                >
                  ⚡ {diff.label}
                </text>
              </g>
            </g>
          ))}
        </g>
      )}

      {/* Official ISO 7200 Engineering Title Block */}
      <g id="iso-title-block" transform="translate(630, 520)">
        {/* Main Box */}
        <rect x="0" y="0" width="335" height="145" fill={bgFill} stroke={mainStroke} strokeWidth="2" opacity="0.95" />
        <line x1="0" y1="35" x2="335" y2="35" stroke={mainStroke} strokeWidth="1" />
        <line x1="0" y1="70" x2="335" y2="70" stroke={mainStroke} strokeWidth="1" />
        <line x1="0" y1="105" x2="335" y2="105" stroke={mainStroke} strokeWidth="1" />
        <line x1="180" y1="35" x2="180" y2="145" stroke={mainStroke} strokeWidth="1" />
        <line x1="260" y1="35" x2="260" y2="105" stroke={mainStroke} strokeWidth="1" />

        {/* Company Header & Department */}
        <text x="12" y="20" fill={mainStroke} fontSize="12" fontWeight="bold" fontFamily="Chakra Petch, sans-serif">
          PRECISION ENGINEERING CORP. [{drawing.department || 'PROD'}]
        </text>
        <text x="12" y="32" fill={dimStroke} fontSize="8" fontFamily="JetBrains Mono">
          MODEL: {drawing.modelCode || '-'} | {drawing.lengthLabel || 'STD'}
        </text>

        {/* Part Name & Code */}
        <text x="12" y="50" fill={dimStroke} fontSize="9" fontFamily="IBM Plex Sans Thai">ชื่อชิ้นงาน (TITLE)</text>
        <text x="12" y="64" fill={mainStroke} fontSize="11" fontWeight="600" fontFamily="IBM Plex Sans Thai">
          {drawing.title.length > 26 ? drawing.title.substring(0, 26) + '...' : drawing.title}
        </text>

        {/* Part Number */}
        <text x="12" y="85" fill={dimStroke} fontSize="9" fontFamily="JetBrains Mono">รหัสชิ้นส่วน (PART NO.)</text>
        <text x="12" y="99" fill={mainStroke} fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
          {drawing.partNumber}
        </text>

        {/* Drawing Code */}
        <text x="12" y="120" fill={dimStroke} fontSize="9" fontFamily="JetBrains Mono">เลขที่ดรออิ้ง (DWG NO.)</text>
        <text x="12" y="136" fill={mainStroke} fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono">
          {drawing.code}
        </text>

        {/* Revision Stamp Box */}
        <rect x="180" y="35" width="80" height="70" fill={isRevC ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.1)'} />
        <text x="220" y="52" fill={dimStroke} fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">REVISION</text>
        <text
          x="220"
          y="82"
          fill={isRevC ? '#10b981' : isBlueprint ? '#38bdf8' : '#0284c7'}
          fontSize="22"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="Chakra Petch, sans-serif"
        >
          {activeVersion.version}
        </text>
        <text x="220" y="98" fill={dimStroke} fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">
          {activeVersion.ecoNumber}
        </text>

        {/* Status / Approval */}
        <text x="297" y="50" fill={dimStroke} fontSize="8" textAnchor="middle">STATUS</text>
        <rect
          x="266"
          y="56"
          width="62"
          height="22"
          rx="3"
          fill={activeVersion.isApprovedForProduction ? '#059669' : '#d97706'}
        />
        <text x="297" y="70" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
          {activeVersion.isApprovedForProduction ? 'APPROVED' : 'TRIAL'}
        </text>

        {/* Scale & Units */}
        <text x="190" y="120" fill={dimStroke} fontSize="9">SCALE: {drawing.scale}</text>
        <text x="190" y="135" fill={dimStroke} fontSize="9">UNIT: {drawing.unit}</text>
        <text x="260" y="120" fill={dimStroke} fontSize="9">TOL: {drawing.toleranceStandard.substring(0, 10)}</text>
        <text x="260" y="135" fill={dimStroke} fontSize="8" fontFamily="JetBrains Mono">DATE: {activeVersion.releaseDate.substring(0, 10)}</text>
      </g>

      {/* Production Floor Verification Stamp */}
      <g transform="translate(450, 570)">
        <rect
          x="0"
          y="0"
          width="165"
          height="95"
          rx="6"
          fill={activeVersion.isApprovedForProduction ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'}
          stroke={activeVersion.isApprovedForProduction ? '#10b981' : '#ef4444'}
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <text
          x="82"
          y="22"
          fill={activeVersion.isApprovedForProduction ? '#10b981' : '#ef4444'}
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="Chakra Petch"
        >
          {activeVersion.isApprovedForProduction ? '✓ RELEASED FOR PRODUCTION' : '⚠ NOT FOR MASS PRODUCTION'}
        </text>
        <text x="82" y="40" fill={dimStroke} fontSize="9" textAnchor="middle" fontFamily="IBM Plex Sans Thai">
          สายการผลิต: {drawing.productionLine.split(' - ')[0]}
        </text>
        <text x="82" y="55" fill={dimStroke} fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">
          เครื่องจักร: {drawing.machineNo.split(' ')[0]}
        </text>
        <text x="82" y="75" fill={mainStroke} fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">
          STAMP ID: {drawing.id.toUpperCase()}
        </text>
      </g>
    </svg>
  );
};

// 1. FLANGE COMPONENT GEOMETRY (Front Face + Section A-A)
const FlangeGeometry: React.FC<{
  isRevC: boolean;
  isRevB: boolean;
  mainStroke: string;
  dimStroke: string;
  centerLineStroke: string;
  hatchFill: string;
  showDiff: boolean;
  selectedDimId: string | null;
  onSelectDim?: (id: string) => void;
}> = ({
  isRevC,
  isRevB,
  mainStroke,
  dimStroke,
  centerLineStroke,
  hatchFill,
  showDiff,
  selectedDimId,
  onSelectDim,
}) => {
  // Bolt hole radius in Rev C = 6.0 (Ø12) vs 5.25 (Ø10.5) in Rev B/A
  const boltHoleRadius = isRevC ? 7.5 : 5.5;

  return (
    <g id="flange-assembly-geometry">
      {/* SECTION VIEW A-A (Left side) */}
      <g transform="translate(180, 270)">
        <text x="0" y="-170" fill={mainStroke} fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
          SECTION A-A (1:1)
        </text>

        {/* Centerline */}
        <line x1="-120" y1="0" x2="120" y2="0" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="14 3 3 3" />
        <line x1="0" y1="-150" x2="0" y2="150" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="14 3 3 3" />

        {/* Flange Cross Section Profile (Top Half) */}
        <path
          d="M -90 -140 L 90 -140 L 90 -115 L 45 -115 L 45 -70 L 35 -70 L 35 0 L -35 0 L -35 -70 L -45 -70 L -45 -115 L -90 -115 Z"
          fill="url(#section-hatch)"
          stroke={mainStroke}
          strokeWidth="2"
        />

        {/* Flange Cross Section Profile (Bottom Half) */}
        <path
          d="M -90 140 L 90 140 L 90 115 L 45 115 L 45 70 L 35 70 L 35 0 L -35 0 L -35 70 L -45 70 L -45 115 L -90 115 Z"
          fill="url(#section-hatch)"
          stroke={mainStroke}
          strokeWidth="2"
        />

        {/* O-Ring Groove Detail (Added in Rev B / C) */}
        {(isRevB || isRevC) && (
          <g>
            <rect x="-42" y="-90" width="10" height="6" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.5" />
            <rect x="-42" y="84" width="10" height="6" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.5" />
            <text x="-55" y="-85" fill={dimStroke} fontSize="8" textAnchor="end" fontFamily="JetBrains Mono">
              O-RING GROOVE Ø70
            </text>
          </g>
        )}

        {/* Chamfers 1.5x45° in Rev C */}
        {isRevC && (
          <g stroke="#10b981" strokeWidth="1.5">
            <line x1="86" y1="-140" x2="90" y2="-136" />
            <line x1="86" y1="140" x2="90" y2="136" />
          </g>
        )}

        {/* Section A-A Dimension Lines */}
        {/* Thickness Dim (28mm) */}
        <g
          id="dim-item-4"
          className="cursor-pointer"
          onClick={() => onSelectDim?.('dim-4')}
        >
          <line x1="-90" y1="-145" x2="-90" y2="-175" stroke={dimStroke} strokeWidth="1" />
          <line x1="-45" y1="-145" x2="-45" y2="-175" stroke={dimStroke} strokeWidth="1" />
          <line
            x1="-90"
            y1="-165"
            x2="-45"
            y2="-165"
            stroke={selectedDimId === 'dim-4' ? '#10b981' : dimStroke}
            strokeWidth={selectedDimId === 'dim-4' ? '2.5' : '1'}
            markerStart="url(#dim-arrow-start)"
            markerEnd="url(#dim-arrow-end)"
          />
          <rect x="-75" y="-178" width="40" height="16" fill="#0f2744" rx="2" />
          <text
            x="-55"
            y="-166"
            fill={selectedDimId === 'dim-4' ? '#10b981' : mainStroke}
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            28.00 ±0.05
          </text>
        </g>
      </g>

      {/* FRONT VIEW (Center Right) - Face of Flange with 6 Bolt Holes */}
      <g transform="translate(470, 270)">
        <text x="0" y="-170" fill={mainStroke} fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
          FRONT VIEW & PCD 6x HOLES
        </text>

        {/* Centerlines */}
        <line x1="-160" y1="0" x2="160" y2="0" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="14 3 3 3" />
        <line x1="0" y1="-160" x2="0" y2="160" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="14 3 3 3" />

        {/* Outer Circle (Ø160) */}
        <circle
          cx="0"
          cy="0"
          r="140"
          fill="none"
          stroke={mainStroke}
          strokeWidth="2.5"
          className="cursor-pointer"
          onClick={() => onSelectDim?.('dim-1')}
        />

        {/* PCD Circle (Ø125) */}
        <circle
          cx="0"
          cy="0"
          r="105"
          fill="none"
          stroke={centerLineStroke}
          strokeWidth="1"
          strokeDasharray="8 3 3 3"
          className="cursor-pointer"
          onClick={() => onSelectDim?.('dim-3')}
        />

        {/* Hub Boss Step (Ø80) */}
        <circle cx="0" cy="0" r="70" fill="none" stroke={mainStroke} strokeWidth="1.5" />

        {/* Center Shaft Bore (Ø50 H7) */}
        <circle
          cx="0"
          cy="0"
          r="42"
          fill="none"
          stroke={selectedDimId === 'dim-2' ? '#10b981' : mainStroke}
          strokeWidth={selectedDimId === 'dim-2' ? '3' : '2'}
          className="cursor-pointer"
          onClick={() => onSelectDim?.('dim-2')}
        />

        {/* 6 Bolt Holes arranged on PCD circle (60 deg intervals) */}
        {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
          const rad = (angle * Math.PI) / 180;
          const hx = 105 * Math.cos(rad);
          const hy = 105 * Math.sin(rad);
          return (
            <g key={idx}>
              <circle
                cx={hx}
                cy={hy}
                r={boltHoleRadius}
                fill={isRevC ? 'rgba(56, 189, 248, 0.4)' : 'none'}
                stroke={isRevC ? '#38bdf8' : mainStroke}
                strokeWidth="1.5"
              />
              {/* Hole crosshairs */}
              <line x1={hx - 12} y1={hy} x2={hx + 12} y2={hy} stroke={centerLineStroke} strokeWidth="0.8" />
              <line x1={hx} y1={hy - 12} x2={hx} y2={hy + 12} stroke={centerLineStroke} strokeWidth="0.8" />
            </g>
          );
        })}

        {/* Dimension Leader to 6x Bolt Holes */}
        <g>
          <path d="M 52 -90 L 110 -150 L 180 -150" fill="none" stroke={dimStroke} strokeWidth="1.2" markerStart="url(#leader-arrow)" />
          <rect x="110" y="-168" width="125" height="20" fill="#0f2744" rx="3" />
          <text x="115" y="-154" fill={isRevC ? '#38bdf8' : mainStroke} fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
            {isRevC ? '6x Ø12.0 THRU' : '6x Ø10.5 THRU'}
          </text>
        </g>

        {/* Dimension Leader to Center Bore (Ø50 H7) */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectDim?.('dim-2')}
        >
          <path d="M -30 30 L -90 90 L -160 90" fill="none" stroke={selectedDimId === 'dim-2' ? '#10b981' : dimStroke} strokeWidth="1.2" markerStart="url(#leader-arrow)" />
          <rect x="-160" y="76" width="105" height="20" fill="#0f2744" rx="3" />
          <text
            x="-155"
            y="90"
            fill={selectedDimId === 'dim-2' ? '#10b981' : mainStroke}
            fontSize="11"
            fontWeight="bold"
            fontFamily="JetBrains Mono"
          >
            Ø50.00 H7 (+0.025/-0)
          </text>
        </g>

        {/* PCD Ø125 Indicator */}
        <text x="0" y="118" fill={dimStroke} fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">
          PCD Ø125.00 ±0.05
        </text>
      </g>
    </g>
  );
};

// 2. STEPPED SHAFT GEOMETRY
const ShaftGeometry: React.FC<{
  drawing: Drawing;
  isRevB: boolean;
  mainStroke: string;
  dimStroke: string;
  centerLineStroke: string;
  hatchFill: string;
  showDiff: boolean;
  selectedDimId: string | null;
  onSelectDim?: (id: string) => void;
  isBlueprint?: boolean;
}> = ({
  drawing,
  isRevB,
  mainStroke,
  dimStroke,
  centerLineStroke,
  selectedDimId,
  onSelectDim,
  isBlueprint,
}) => {
  return (
    <g id="shaft-geometry" transform="translate(140, 270)">
      <text x="350" y="-160" fill={mainStroke} fontSize="14" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
        MAIN DRIVE TRANSMISSION SHAFT (LONGITUDINAL SECTION)
      </text>

      {/* Main Centerline */}
      <line x1="-60" y1="0" x2="750" y2="0" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="16 3 3 3" />

      {/* Stepped Shaft Outline */}
      <path
        d="M 0 -25 L 120 -25 L 120 -35 L 260 -35 L 260 -50 L 450 -50 L 450 -35 L 580 -35 L 580 -25 L 680 -25 L 680 25 L 580 25 L 580 35 L 450 35 L 450 50 L 260 50 L 260 35 L 120 35 L 120 25 L 0 25 Z"
        fill="url(#section-hatch)"
        stroke={mainStroke}
        strokeWidth="2.5"
      />

      {/* Keyway 10x8 Detail */}
      <rect
        x="30"
        y="-15"
        width="65"
        height="30"
        fill="#10b981"
        fillOpacity="0.2"
        stroke="#10b981"
        strokeWidth="1.5"
        rx="4"
        className="cursor-pointer"
        onClick={() => onSelectDim?.('dim-s4')}
      />
      <text x="62" y="4" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
        KEYWAY 10x8 DIN6885
      </text>

      {/* Bearing Journal Section Highlight */}
      <rect
        x="260"
        y="-35"
        width="190"
        height="70"
        fill={selectedDimId === 'dim-s1' ? 'rgba(16, 185, 129, 0.2)' : 'none'}
        stroke={selectedDimId === 'dim-s1' ? '#10b981' : '#38bdf8'}
        strokeWidth="2"
        className="cursor-pointer"
        onClick={() => onSelectDim?.('dim-s1')}
      />

      {/* Dimension Lines */}
      {/* Journal Diameter Callout */}
      <g className="cursor-pointer" onClick={() => onSelectDim?.('dim-s1')}>
        <path d="M 355 -35 L 355 -90 L 420 -90" fill="none" stroke={dimStroke} strokeWidth="1.2" markerStart="url(#leader-arrow)" />
        <rect x="420" y="-105" width="130" height="22" fill="#0f2744" rx="3" />
        <text x="425" y="-90" fill={selectedDimId === 'dim-s1' ? '#10b981' : mainStroke} fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
          Ø35.00 k5 (+0.011/+0.002)
        </text>
      </g>

      {/* Runout GD&T Control Frame */}
      <g transform="translate(260, 80)">
        <rect x="0" y="0" width="90" height="24" fill="#0f2744" stroke={mainStroke} strokeWidth="1.2" />
        <line x1="30" y1="0" x2="30" y2="24" stroke={mainStroke} strokeWidth="1.2" />
        <line x1="65" y1="0" x2="65" y2="24" stroke={mainStroke} strokeWidth="1.2" />
        <text x="15" y="16" fill={mainStroke} fontSize="13" textAnchor="middle">↗</text>
        <text x="47" y="16" fill={mainStroke} fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">0.01</text>
        <text x="77" y="16" fill={mainStroke} fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">A-B</text>
      </g>

      {/* Production Length Callout */}
      <g transform="translate(0, 115)">
        <line x1="0" y1="-85" x2="0" y2="10" stroke={dimStroke} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="680" y1="-85" x2="680" y2="10" stroke={dimStroke} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="0" y1="0" x2="680" y2="0" stroke={dimStroke} strokeWidth="1.5" markerStart="url(#dim-arrow-start)" markerEnd="url(#dim-arrow-end)" />
        <rect x="230" y="-12" width="220" height="24" fill={isBlueprint ? '#0f2744' : '#090d16'} rx="4" />
        <text x="340" y="4" fill={mainStroke} fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
          L = {drawing.lengthMm || 500}.00 ±0.20 mm ({drawing.lengthLabel || 'STD'})
        </text>
      </g>
    </g>
  );
};

// 3. HYDRAULIC MANIFOLD GEOMETRY
const ManifoldGeometry: React.FC<{
  isRevB: boolean;
  mainStroke: string;
  dimStroke: string;
  centerLineStroke: string;
  hatchFill: string;
  showDiff: boolean;
  selectedDimId: string | null;
  onSelectDim?: (id: string) => void;
}> = ({
  isRevB,
  mainStroke,
  dimStroke,
  centerLineStroke,
  selectedDimId,
  onSelectDim,
}) => {
  return (
    <g id="manifold-geometry" transform="translate(200, 160)">
      <text x="280" y="-40" fill={mainStroke} fontSize="14" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
        4-WAY HYDRAULIC MANIFOLD VALVE BLOCK (ORTHOGRAPHIC VIEW)
      </text>

      {/* Solid Manifold Billet Outline */}
      <rect x="40" y="0" width="480" height="300" fill="none" stroke={mainStroke} strokeWidth="3" rx="4" />

      {/* Internal Oil Channels & Cross Bore (Dashed) */}
      <line x1="40" y1="150" x2="520" y2="150" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="14 3 3 3" />
      <line x1="160" y1="0" x2="160" y2="300" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="14 3 3 3" />
      <line x1="400" y1="0" x2="400" y2="300" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="14 3 3 3" />

      {/* Cavity Ports P, T, A, B */}
      <g transform="translate(160, 60)">
        <circle cx="0" cy="0" r="30" fill="none" stroke={mainStroke} strokeWidth="2" />
        <circle cx="0" cy="0" r="22" fill="#0f2744" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="0" y="4" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
          PORT P {isRevB ? 'G1/2"' : 'G3/8"'}
        </text>
      </g>

      <g transform="translate(400, 60)">
        <circle cx="0" cy="0" r="30" fill="none" stroke={mainStroke} strokeWidth="2" />
        <circle cx="0" cy="0" r="22" fill="#0f2744" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="0" y="4" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
          PORT T {isRevB ? 'G1/2"' : 'G3/8"'}
        </text>
      </g>

      <g transform="translate(280, 200)">
        <rect
          x="-70"
          y="-35"
          width="140"
          height="70"
          fill={selectedDimId === 'dim-m1' ? 'rgba(16, 185, 129, 0.2)' : 'none'}
          stroke={selectedDimId === 'dim-m1' ? '#10b981' : mainStroke}
          strokeWidth="2"
          className="cursor-pointer"
          onClick={() => onSelectDim?.('dim-m1')}
        />
        <text x="0" y="4" fill={mainStroke} fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="JetBrains Mono">
          VALVE CAVITY #01 (DEPTH 45.0)
        </text>
      </g>
    </g>
  );
};

// 4. SHEET METAL BRACKET GEOMETRY
const BracketGeometry: React.FC<{
  mainStroke: string;
  dimStroke: string;
  centerLineStroke: string;
  hatchFill: string;
  showDiff: boolean;
  selectedDimId: string | null;
  onSelectDim?: (id: string) => void;
}> = ({
  mainStroke,
  dimStroke,
  centerLineStroke,
  selectedDimId,
  onSelectDim,
}) => {
  return (
    <g id="bracket-geometry" transform="translate(220, 180)">
      <text x="250" y="-50" fill={mainStroke} fontSize="14" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
        PRECISION SERVO MOUNTING BRACKET (FLAT PATTERN + 90° BEND)
      </text>

      {/* Base Flange */}
      <rect x="0" y="0" width="300" height="200" fill="none" stroke={mainStroke} strokeWidth="2.5" rx="4" />

      {/* Bend Line */}
      <line x1="120" y1="0" x2="120" y2="200" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="10 4 3 4" />
      <text x="125" y="20" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
        BEND 90° R3.0
      </text>

      {/* Center Servo Pilot Bore (Ø70) */}
      <g transform="translate(210, 100)" className="cursor-pointer" onClick={() => onSelectDim?.('dim-b2')}>
        <circle cx="0" cy="0" r="45" fill="none" stroke={mainStroke} strokeWidth="2" />
        <line x1="-55" y1="0" x2="55" y2="0" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="12 3 3 3" />
        <line x1="0" y1="-55" x2="0" y2="55" stroke={centerLineStroke} strokeWidth="1" strokeDasharray="12 3 3 3" />
        <text x="0" y="4" fill={selectedDimId === 'dim-b2' ? '#10b981' : mainStroke} fontSize="10" fontWeight="bold" textAnchor="middle">
          Ø70.00 ±0.05
        </text>
      </g>

      {/* 4 Corner Mounting Holes */}
      {[[30, 30], [30, 170], [90, 30], [90, 170]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="none" stroke={mainStroke} strokeWidth="1.5" />
      ))}
    </g>
  );
};
