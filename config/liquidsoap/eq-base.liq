# Basic EQ example for Liquidsoap.
# Adjust gently and test against your codec chain.

def apply_eq(s) =
  s
  |> filter.iir.eq.peak(frequency=90., gain=1.5, q=0.9)
  |> filter.iir.eq.peak(frequency=3200., gain=1.0, q=0.8)
  |> filter.iir.eq.high_shelf(frequency=12000., gain=1.2, q=0.7)
end
