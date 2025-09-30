import { prisma } from "@/app/lib/prisma";
import {
  CreateBusinessProps,
  FinalStepFormValues,
} from "../validators/businessCreationSchema";
import { formatStringToSlug } from "../helpers/strings.helpers";
import {
  Branch,
  Business,
  Customer,
  Feedback,
  FeedbackHooters,
  Waiter,
} from "@/app/types/business";

// =============================
// Business
// =============================
const findBusiness = async (
  businessId: string,
  branchId?: string,
  waiterId?: string
): Promise<Business | null> => {
  if (branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { waiters: true },
    });

    if (!branch) return null;

    return {
      Id: branch.id,
      Name: branch.name,
      Address: branch.address,
      Country: (branch.country as Branch["Country"]) || "CO",
      Icono: branch.icon || "",
      IconoWhite: "",
      MapsUrl: branch.mapsUrl || "",
      Cover: branch.cover || "",
      sucursales: [],
      meseros: branch.waiters.map((w) => ({
        id: w.id,
        name: w.name,
        gender: w.gender,
        sucursalId: branch.id,
        numberOfSurveys: 0,
        numberOfFeedbackPerRating: {},
        feedbacks: [],
        customers: [],
      })),
      Waiter: waiterId
        ? (await prisma.waiter.findUnique({ where: { id: waiterId } })) ||
          undefined
        : undefined,
      feedbacks: [],
      customers: [],
      PricePlan: 0,
      Geopoint: undefined,
    } as Business;
  }

  // Si es el negocio principal
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { branches: true, waiters: true },
  });

  if (!business) return null;

  return getBusinessDataFromUser(businessId); // reutilizamos la función anterior
};

// =============================
// User <-> Business
// =============================
const getBusinessDataFromUser = async (
  userId: string
): Promise<Business | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      business: {
        include: {
          branches: { include: { waiters: true } },
          waiters: true,
          customers: true,
        },
      },
    },
  });

  if (!user || !user.business) return null;

  const biz = user.business;

  // Map branches
  const mappedBranches: Branch[] = biz.branches.map((b) => ({
    Id: b.id,
    Name: b.name,
    Address: b.address,
    Country: (b.country as Branch["Country"]) || "CO",
    Icono: b.icon || "",
    IconoWhite: "",
    MapsUrl: b.mapsUrl || "",
    Cover: b.cover || "",
    Waiters: b.waiters.map((w) => ({
      id: w.id,
      name: w.name,
      gender: w.gender,
      sucursalId: b.id,
      numberOfSurveys: 0,
      numberOfFeedbackPerRating: {},
      feedbacks: [],
    })),
    feedbacks: [],
    customers: [],
    PricePlan: 0,
    meseros: [],
    Geopoint: undefined,
  }));

  // Map business waiters
  const mappedWaiters: Waiter[] = biz.waiters.map((w) => ({
    id: w.id,
    name: w.name,
    gender: w.gender,
    sucursalId: w.branchId || "",
    numberOfSurveys: 0,
    numberOfFeedbackPerRating: {},
    feedbacks: [],
    customers: [],
  }));

  const response: Business = {
    Id: biz.id,
    parentId: formatStringToSlug(biz.id),
    Name: biz.Name,
    Address: "", // Puedes agregar dirección principal
    Country: (biz.country as Business["Country"]) || "CO",
    Icono: "",
    IconoWhite: biz.IconoWhite || "",
    Cover: biz.Cover || "",
    MapsUrl: "",
    PricePlan: biz.PricePlan || 0,
    SocialMedia: (biz.SocialMedia as Record<string, string>[]) || [],
    sucursales: mappedBranches,
    meseros: mappedWaiters,
    Waiter: undefined,
    feedbacks: [],
    customers: [],
    Geopoint: undefined,
  };

  return response;
};

const handleUpdateUser = async ({
  userId,
  businessId,
}: {
  userId: string;
  businessId: string;
}) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { businessId },
  });
};

const handleCreateBusiness = async ({
  values,
  IconoWhite,
  Cover,
  userId,
}: {
  values: CreateBusinessProps;
  IconoWhite: string;
  Cover: string;
  userId: string;
}) => {
  const business = await prisma.business.create({
    data: {
      ...values,
      IconoWhite,
      Cover,
      slug: formatStringToSlug(values.Name),
      users: {
        connect: { id: userId },
      },
    },
  });

  await handleUpdateUser({ userId, businessId: business.id });

  return business;
};

// =============================
// Waiters
// =============================
const handleCreateWaiter = async ({
  waiter,
  businessId,
}: {
  waiter: { name: string; gender: string };
  businessId: string;
}) => {
  const newWaiter = await prisma.waiter.create({
    data: {
      name: waiter.name,
      gender: waiter.gender,
      businessId,
    },
  });
  return newWaiter.id;
};

const handleDeleteWaiter = async ({
  businessId,
  waiterId,
}: {
  businessId: string;
  waiterId: string;
}) => {
  return await prisma.waiter.delete({
    where: { id: waiterId },
  });
};

// =============================
// Branches
// =============================
const handleCreateBranch = async ({
  branch,
  businessId,
  country,
}: {
  branch: {
    Name: string;
    Address: string;
    MapsUrl: string;
    icon: string;
    cover: string;
    branchId: string;
  };
  businessId: string;
  country: string;
}) => {
  const newBranch = await prisma.branch.create({
    data: {
      name: branch.Name,
      address: branch.Address,
      mapsUrl: branch.MapsUrl,
      icon: branch.icon,
      cover: branch.cover,
      country,
      businessId,
    },
  });
  return newBranch.id;
};

const handleDeleteBranch = async ({
  branchId,
}: {
  businessId: string;
  branchId: string;
}) => {
  return await prisma.branch.delete({
    where: { id: branchId },
  });
};

// =============================
// Feedback
// =============================
async function getFeedbackData(
  userId: string,
  branchId: string | null,
  mainBusinessId: string | null
) {
  const businessData = await getBusinessDataFromUser(userId);
  if (!businessData) return null;

  if (!branchId) {
    return await prisma.business.findUnique({
      where: { id: businessData.Id },
      include: {
        customers: {
          include: { feedbacks: true },
        },
        waiters: true,
      },
    });
  } else if (branchId === "todas") {
    return await prisma.business.findUnique({
      where: { id: businessData.Id },
      include: {
        branches: {
          include: {
            customers: { include: { feedbacks: true } },
            waiters: true,
          },
        },
      },
    });
  } else {
    return await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        customers: { include: { feedbacks: true } },
        waiters: true,
      },
    });
  }
}

// =============================
// Update business info
// =============================
const handleUpdateBusiness = async ({
  businessId,
  payload,
  pricePlan,
}: {
  businessId: string;
  payload: FinalStepFormValues;
  pricePlan: number;
}) => {
  return await prisma.business.update({
    where: { id: businessId },
    data: {
      SocialMedia: payload.socialMedia,
      Plan: payload.IdealPlan,
      BusinessProgram: payload.BusinessProgram,
      Template: payload.Template,
      PricePlan: pricePlan,
    },
  });
};

// =============================
// Exports
// =============================
export {
  findBusiness,
  getBusinessDataFromUser,
  handleUpdateUser,
  handleCreateBusiness,
  handleCreateWaiter,
  handleDeleteWaiter,
  handleCreateBranch,
  handleDeleteBranch,
  handleUpdateBusiness,
  getFeedbackData,
};
