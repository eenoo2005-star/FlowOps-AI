interface FlowBackgroundProps {
  variant?: 'workspace' | 'login'
}

const nodes = [
  [8, 18],
  [20, 34],
  [34, 16],
  [48, 42],
  [62, 20],
  [74, 36],
  [90, 18],
  [13, 72],
  [30, 58],
  [48, 78],
  [66, 62],
  [84, 76],
] as const

function FlowBackground({
  variant = 'workspace',
}: FlowBackgroundProps) {
  return (
    <div
      className={`flowops-background flowops-background-${variant}`}
      aria-hidden="true"
    >
      <div className="flowops-mesh flowops-mesh-one" />
      <div className="flowops-mesh flowops-mesh-two" />
      <div className="flowops-mesh flowops-mesh-three" />
      <div className="flowops-light-ribbon flowops-light-ribbon-one" />
      <div className="flowops-light-ribbon flowops-light-ribbon-two" />

      <svg
        className="flowops-network"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id={`flowops-line-${variant}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="rgb(59 130 246)"
              stopOpacity="0.08"
            />
            <stop
              offset="48%"
              stopColor="rgb(99 102 241)"
              stopOpacity="0.32"
            />
            <stop
              offset="100%"
              stopColor="rgb(14 165 233)"
              stopOpacity="0.1"
            />
          </linearGradient>

          <filter id={`flowops-glow-${variant}`}>
            <feGaussianBlur stdDeviation="0.45" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="flowops-network-line flowops-network-line-a"
          d="M-5 70 C15 30 28 90 46 48 S74 4 105 42"
          stroke={`url(#flowops-line-${variant})`}
        />

        <path
          className="flowops-network-line flowops-network-line-b"
          d="M-8 24 C18 56 34 4 54 40 S84 92 108 58"
          stroke={`url(#flowops-line-${variant})`}
        />

        <path
          className="flowops-network-line flowops-network-line-c"
          d="M4 92 C24 64 40 74 52 28 S78 18 98 4"
          stroke={`url(#flowops-line-${variant})`}
        />

        <path
          className="flowops-network-line flowops-network-line-d"
          d="M2 10 C28 4 34 50 58 58 S86 50 102 84"
          stroke={`url(#flowops-line-${variant})`}
        />

        {nodes.map(([cx, cy], index) => (
          <g
            key={`${cx}-${cy}`}
            className={`flowops-network-node flowops-network-node-${(index % 4) + 1}`}
            filter={`url(#flowops-glow-${variant})`}
          >
            <circle
              cx={cx}
              cy={cy}
              r={index % 3 === 0 ? 0.75 : 0.52}
            />
            <circle
              className="flowops-network-node-ring"
              cx={cx}
              cy={cy}
              r={index % 3 === 0 ? 1.65 : 1.28}
            />
          </g>
        ))}

        <circle
          className="flowops-traveller flowops-traveller-one"
          r="0.7"
        >
          <animateMotion
            dur="17s"
            repeatCount="indefinite"
            path="M-5 70 C15 30 28 90 46 48 S74 4 105 42"
          />
        </circle>

        <circle
          className="flowops-traveller flowops-traveller-two"
          r="0.55"
        >
          <animateMotion
            dur="23s"
            begin="-8s"
            repeatCount="indefinite"
            path="M-8 24 C18 56 34 4 54 40 S84 92 108 58"
          />
        </circle>
      </svg>

      <div className="flowops-noise" />
    </div>
  )
}

export default FlowBackground
