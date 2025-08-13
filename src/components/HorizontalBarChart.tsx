import React from 'react';
import { View } from 'react-native';
import { BarChart, YAxis } from 'react-native-svg-charts';
import { G, Text as SVGText } from 'react-native-svg';

export interface DataPoint {
  category: string;
  value: number;
}

interface Props {
  data: DataPoint[];
}

const HorizontalBarChart: React.FC<Props> = ({ data }: Props) => {
  if (!Array.isArray(data) || data.length === 0) return null;

  const cleanData: DataPoint[] = data.filter(
    (item): item is DataPoint =>
      item &&
      typeof item.category === 'string' &&
      typeof item.value === 'number' &&
      !isNaN(item.value)
  );

  if (cleanData.length === 0) return null;

  const values: number[] = cleanData.map((item) => item.value);
  const labels: string[] = cleanData.map((item) => item.category);

  const Labels = ({
    x,
    y,
    bandwidth,
    data,
  }: {
    x: (value: number) => number;
    y: (index: number) => number;
    bandwidth: number;
    data: number[];
  }) => (
    <G>
      {data.map((value, index) => (
        <SVGText
          key={`label-${index}`}
          x={x(value) + 5}
          y={y(index) + bandwidth / 2}
          fontSize={12}
          fill="black"
          alignmentBaseline="middle"
        >
          ₹ {value.toFixed(2)}
        </SVGText>
      ))}
    </G>
  );

  return (
    <View style={{ flexDirection: 'row', height: cleanData.length * 40 + 20, paddingHorizontal: 16 }}>
      <YAxis
        data={values}
        yAccessor={({ index }: { index: number }) => index}
        formatLabel={(_: number, index: number) => labels[index] ?? ''}
        contentInset={{ top: 10, bottom: 10 }}
        svg={{ fontSize: 12, fill: 'black' }}
        style={{ marginRight: 10 }}
      />

      <BarChart
        style={{ flex: 1 }}
        data={values}
        yAccessor={({ index }: { index: number }) => index}
        horizontal
        svg={{ fill: '#4a90e2' }}
        spacingInner={0.3}
        contentInset={{ top: 10, bottom: 10 }}
      >
        {(props: {
  x: (value: number) => number;
  y: (index: number) => number;
  bandwidth: number;
  data: number[];
}) => (
  <Labels
    x={props.x}
    y={props.y}
    bandwidth={props.bandwidth}
    data={props.data}
  />
)}
      </BarChart>
    </View>
  );
};

export default HorizontalBarChart;