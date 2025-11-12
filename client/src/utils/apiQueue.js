class ApiQueue {
  constructor(minInterval = 500, maxConcurrent = 3) {
    this.queue = [];
    this.minInterval = minInterval;
    this.maxConcurrent = maxConcurrent;
    this.activeRequests = 0;
    this.lastRequestTime = 0;
    this.isProcessing = false;
  }

  async add(apiCall) {
    return new Promise((resolve, reject) => {
      this.queue.push({ apiCall, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }

      const { apiCall, resolve, reject } = this.queue.shift();
      this.activeRequests++;

      try {
        this.lastRequestTime = Date.now();
        const result = await apiCall();
        resolve(result);
      } catch (error) {
        if (error?.response?.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          this.queue.unshift({ apiCall, resolve, reject });
        } else {
          reject(error);
        }
      } finally {
        this.activeRequests--;
        if (this.queue.length > 0) {
          this.processQueue();
        }
      }
    }

    this.isProcessing = false;
  }
}

const apiQueue = new ApiQueue();
export default apiQueue;