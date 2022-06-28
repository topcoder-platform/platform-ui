/**
 * ProgressDonutChart
 *
 * Progress Donut Chart to display on top-right of the page
 */
import React, { useState } from "react";
import PT from "prop-types";
import cn from "classnames";
import "./styles.module.scss";
import Chart from "react-apexcharts";

const ProgressDonutChart = ({ progress, styleName, ...props }) => {
  // chart options to display donut chart
  const [chartOptions, setChartOptions] = useState({
    chart: {
      height: 150,
      width: 120,
      type: "radialBar",
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: "40%",
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: false,
          },
        },
      },
    },
    stroke: {
      lineCap: "round",
    },
    fill: {
      colors: ["#9d41c9"],
    },
  });
  return (
    <div styleName={cn("progress-donut-chart", styleName || "")} {...props}>
      <div id="chart">
        <Chart
          options={chartOptions}
          series={[progress]}
          type="radialBar"
          height={150}
          width={120}
        />
      </div>
    </div>
  );
};

ProgressDonutChart.propTypes = {
  progress: PT.number,
};

export default ProgressDonutChart;
