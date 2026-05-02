# Compression / loudness example.
# Liquidsoap operators vary across versions, treat this as a starting point.

def apply_radio_fx(s) =
  s
  |> normalize(target=-16.)
  |> compress.exponential(ratio=2.0, attack=20., release=250., threshold=-18.)
  |> limit(threshold=-1.0)
end
