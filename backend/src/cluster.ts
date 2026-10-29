import cluster from 'cluster';
import os from 'os';

const numCPUs = process.env.WEB_CONCURRENCY ? parseInt(process.env.WEB_CONCURRENCY, 10) : os.cpus().length;

if (cluster.isPrimary) {
  console.log(`⚡ OrderKare Master Cluster [PID: ${process.pid}] starting ${numCPUs} worker processes for 50k+ concurrency...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(` Worker ${worker.process.pid} is online and accepting connections`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.warn(` Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Spawning replacement worker...`);
    cluster.fork();
  });
} else {
  // Workers share the TCP connection and port
  require('../index');
}
