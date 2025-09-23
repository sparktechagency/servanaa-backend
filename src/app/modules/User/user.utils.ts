/* eslint-disable @typescript-eslint/no-explicit-any */

import { User } from './user.model';

// Admin ID
export const findLastAdminId = async () => {
  const lastAdmin: any = await User.findOne(
    {
      role: 'admin'
    },
    {
      id: 1,
      _id: 0
    }
  )
    .sort({
      createdAt: -1
    })
    .lean();

  return lastAdmin?.id ? lastAdmin.id.substring(2) : undefined;
};

export const generateAdminId = async () => {
  let currentId = (0).toString();
  const lastAdminId = await findLastAdminId();

  if (lastAdminId) {
    currentId = lastAdminId.substring(2);
  }

  let incrementId = (Number(currentId) + 1).toString().padStart(4, '0');

  incrementId = `A-${incrementId}`;
  return incrementId;
};

// Judge ID
export const findLastJudgeId = async () => {
  const lastJudge: any = await User.findOne(
    {
      role: 'judge'
    },
    {
      id: 1,
      _id: 0
    }
  )
    .sort({
      createdAt: -1
    })
    .lean();

  return lastJudge?.id ? lastJudge.id.substring(2) : undefined;
};

export const generateJudgeId = async () => {
  let currentId = (0).toString();
  const lastJudgeId = await findLastJudgeId();

  if (lastJudgeId) {
    currentId = lastJudgeId.substring(2);
  }

  let incrementId = (Number(currentId) + 1).toString().padStart(4, '0');

  incrementId = `J-${incrementId}`;

  return incrementId;
};

// Actor ID
export const findLastActorId = async () => {
  const lastActor: any = await User.findOne(
    {
      role: 'actor'
    },
    {
      id: 1,
      _id: 0
    }
  )
    .sort({
      createdAt: -1
    })
    .lean();

  return lastActor?.id ? lastActor.id.substring(2) : undefined;
};

export const generateActorId = async () => {
  let currentId = (0).toString();
  const lastActorId = await findLastActorId();

  if (lastActorId) {
    currentId = lastActorId.substring(2);
  }

  let incrementId = (Number(currentId) + 1).toString().padStart(4, '0');

  incrementId = `AC-${incrementId}`;

  return incrementId;
};
