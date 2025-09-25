import dynamic from 'next/dynamic';
const ReactEcharts = dynamic(() => import('echarts-for-react'));

interface Props {
  average: number;
}

export default function MultipleQuestionsChart({ average }: Props) {
  const averagePercentage = Number(((average / 5) * 100).toFixed(2));
  const difference = 100 - averagePercentage;

  return (
    <div>
      <ReactEcharts
        option={{
          color: ['#1F64B0', '#E6E7EB'],
          tooltip: {
            trigger: 'item',
          },
          legend: {
            top: '5%',
            left: 'right',
          },
          series: [
            {
              name: 'Promedio general en %',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              label: {
                show: false,
                position: 'center',
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 40,
                  fontWeight: 'bold',
                },
              },
              labelLine: {
                show: false,
              },
              data: [{ value: averagePercentage }, { value: difference }],
            },
          ],
        }}></ReactEcharts>
    </div>
  );
}
