import {
  Box,
  HStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
} from "@chakra-ui/react";

export const SliderRow = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => {
  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm">{label}</Text>
        <Text fontSize="sm" fontWeight="600">
          {value}
        </Text>
      </HStack>

      <Slider min={min} max={max} step={step} value={value} onChange={onChange}>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </Box>
  );
};
