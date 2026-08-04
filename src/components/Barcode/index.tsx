import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Rect } from "react-native-svg";

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

export interface BarcodeProps {
  value?: string | null;
  height?: number;
  barColor?: string;
  backgroundColor?: string;
  showText?: boolean;
  quietZoneModules?: number;
  onPress?: () => void;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  height = 40,
  barColor = "#101828",
  backgroundColor = "#FFFFFF",
  showText = true,
  quietZoneModules = 10,
  onPress,
  className = "",
}) => {
  const textValue = (value || "").trim() || "BOARDING PASS";

  let checksum = 104; // Start Code B
  const patterns: string[] = [CODE128_PATTERNS[104]];

  for (let i = 0; i < textValue.length; i++) {
    let code = textValue.charCodeAt(i) - 32;
    if (code < 0 || code > 94) {
      code = 0; // Space fallback for unprintable characters
    }
    patterns.push(CODE128_PATTERNS[code]);
    checksum += (i + 1) * code;
  }

  checksum %= 103;
  patterns.push(CODE128_PATTERNS[checksum]);
  patterns.push(CODE128_PATTERNS[106]); // Stop

  const fullPattern = patterns.join("");

  const bars: { x: number; width: number }[] = [];
  let currentX = quietZoneModules;
  let totalModules = quietZoneModules;

  for (let i = 0; i < fullPattern.length; i++) {
    const width = parseInt(fullPattern[i], 10);
    if (i % 2 === 0) {
      bars.push({ x: currentX, width });
    }
    currentX += width;
    totalModules += width;
  }

  totalModules += quietZoneModules;

  const content = (
    <View className={`items-center justify-center pt-2 pb-1 ${className}`}>
      <View style={{ width: "100%", maxWidth: 300, height }}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${totalModules} ${height}`}
          preserveAspectRatio="none"
        >
          <Rect x={0} y={0} width={totalModules} height={height} fill={backgroundColor} />
          {bars.map((bar, index) => (
            <Rect
              key={index}
              x={bar.x}
              y={0}
              width={bar.width}
              height={height}
              fill={barColor}
            />
          ))}
        </Svg>
      </View>
      {showText ? (
        <Text className="text-[9px] text-gray-400 text-center tracking-[4px] mt-1.5 uppercase font-medium">
          {textValue}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Barcode for ${textValue}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};
