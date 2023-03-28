/**
 * ProgressDonutChart
 *
 * Progress Donut Chart to display on top-right of the page
 */
import React, { useState } from "react";
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";
import Chart from "react-apexcharts";

const ProgressDonutChart = ({ progress, styledName, ...props }) => {
  // chart options to display donut chart
  const [chartOptions] = useState({
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
    <div className={cn(styles["progress-donut-chart"], !!styledName ? styles[styledName] : undefined)} {...props}>
      <div id="chart">
        <div className={styles["mobile-chart"]}>
          <Chart
            options={chartOptions}
            series={[progress]}
            type="radialBar"
            height={100}
            width={80}
          />
        </div>

        <div className={styles["desktop-chart"]}>
          <Chart
            options={chartOptions}
            series={[progress]}
            type="radialBar"
            height={150}
            width={120}
          />
        </div>
      </div>
    </div>
  );
};

ProgressDonutChart.propTypes = {
  progress: PT.number,
};

export default ProgressDonutChart;
