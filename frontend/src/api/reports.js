import api from './axios';

export const createReport = (targetType, targetId, reason, description = '') => {
    return api.post('/reports/', {
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description || undefined,
    });
};
