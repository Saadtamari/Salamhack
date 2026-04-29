import { and, desc, eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db.js";
import {
  contractFlags,
  contracts,
  type ContractFlagRow,
  type ContractRow,
  type NewContractFlagRow,
  type NewContractRow,
} from "../../infrastructure/database/schema.js";

export interface ListContractsOptions {
  analysisStatus?: ContractRow["analysisStatus"];
  clientId?: string;
}

export interface ContractWithFlags extends ContractRow {
  flags: ContractFlagRow[];
}

export class ContractsRepository {
  async list(options: ListContractsOptions = {}): Promise<ContractRow[]> {
    const conditions = [] as Array<ReturnType<typeof eq>>;

    if (options.analysisStatus) {
      conditions.push(eq(contracts.analysisStatus, options.analysisStatus));
    }

    if (options.clientId) {
      conditions.push(eq(contracts.clientId, options.clientId));
    }

    const query = db.select().from(contracts);

    return conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(contracts.createdAt))
      : await query.orderBy(desc(contracts.createdAt));
  }

  async findById(id: string): Promise<ContractRow | null> {
    const [row] = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
    return row ?? null;
  }

  async getFlags(contractId: string): Promise<ContractFlagRow[]> {
    return db
      .select()
      .from(contractFlags)
      .where(eq(contractFlags.contractId, contractId))
      .orderBy(desc(contractFlags.sortOrder), desc(contractFlags.id));
  }

  async findByIdWithFlags(id: string): Promise<ContractWithFlags | null> {
    const contract = await this.findById(id);

    if (!contract) {
      return null;
    }

    const flags = await this.getFlags(id);

    return { ...contract, flags };
  }

  async create(input: NewContractRow, flags: NewContractFlagRow[]): Promise<ContractWithFlags> {
    return db.transaction(async (transaction) => {
      const [contract] = await transaction.insert(contracts).values(input).returning();

      if (flags.length > 0) {
        await transaction.insert(contractFlags).values(
          flags.map((flag) => ({ ...flag, contractId: contract.id })),
        );
      }

      const createdFlags = await transaction
        .select()
        .from(contractFlags)
        .where(eq(contractFlags.contractId, contract.id))
        .orderBy(desc(contractFlags.sortOrder), desc(contractFlags.id));

      return { ...contract, flags: createdFlags };
    });
  }

  async update(id: string, input: Partial<NewContractRow>): Promise<ContractRow | null> {
    const [contract] = await db
      .update(contracts)
      .set(input)
      .where(eq(contracts.id, id))
      .returning();

    return contract ?? null;
  }

  async delete(id: string): Promise<ContractRow | null> {
    return db.transaction(async (transaction) => {
      const [existing] = await transaction.select().from(contracts).where(eq(contracts.id, id)).limit(1);

      if (!existing) {
        return null;
      }

      await transaction.delete(contractFlags).where(eq(contractFlags.contractId, id));
      await transaction.delete(contracts).where(eq(contracts.id, id));

      return existing;
    });
  }
}
