import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Tooltip,
	Legend,
	TimeScale,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale)

type Props = {
	labels: number[]
	prices: number[]
}

export function PriceChart({ labels, prices }: Props) {
	const data = {
		labels,
		datasets: [
			{
				label: '收盤價',
				data: prices,
				borderColor: 'rgb(37, 99, 235)',
				backgroundColor: 'rgba(37, 99, 235, 0.2)',
				pointRadius: 0,
				tension: 0.2,
			},
		],
	}
	const options = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				type: 'time' as const,
				time: { unit: 'day' as const },
				display: true,
			},
			y: { display: true },
		},
		plugins: { legend: { display: false } },
	}
	return (
		<div className="h-64">
			<Line options={options} data={data} />
		</div>
	)
}