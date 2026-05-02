% Speech-first processing
radio = compress.exponential(radio, ratio=1.7, attack=15., release=180., threshold=-20.)
radio = limit(radio, threshold=-2.0)
