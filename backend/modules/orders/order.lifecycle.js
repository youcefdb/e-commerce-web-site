const allowedTransitions = {
    pending: ["paid", "processing", "cancelled"],
    paid: ["processing", "shipped"],
    processing: ["shipped"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
};

const canTransitionOrder = (currentStatus, nextStatus) =>
    allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;

export { allowedTransitions, canTransitionOrder };
