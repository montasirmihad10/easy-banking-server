import { TTypeAccount } from "./type.interface";
import { TypeModel } from "./type.model";

const getTypes = async () => {
  const result = await TypeModel.find();
  return result;
};

const getEachTypes = async (id: string) => {
  const result = await TypeModel.findById(id);
  return result;
};

const updateType = async (id: string, payload: Partial<TTypeAccount>) => {
  const { features, ...remainingData } = payload;
  const updateOps: Record<string, unknown> = {};

  if (Object.keys(remainingData).length > 0) {
    updateOps.$set = remainingData;
  }

  if (Array.isArray(features) && features.length > 0) {
    updateOps.$addToSet = {
      features: { $each: features },
    };
  }

  const result = await TypeModel.findByIdAndUpdate(id, updateOps, {
    new: true,
  });
  return result;
};

export const typeServices = {
  getTypes,
  getEachTypes,
  updateType,
};
