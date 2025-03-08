import PIQBOMapping from '../models/pi-qbo-mapping.model';
import { PIQBOMapping as PIQBOMappingType } from '../models/pi-qbo-mapping.model';
import dbConnect from '../mongodb';

export class PIQBOMappingService {
  async getAllMappings(userId: string): Promise<PIQBOMappingType[]> {
    try {
      await dbConnect();
      const mappings = await PIQBOMapping.find({ userId }).lean();
      return JSON.parse(JSON.stringify(mappings));
    } catch (error) {
      throw new Error('Error fetching PI-QBO mappings from database');
    }
  }

  async getMappingById(id: string, userId: string): Promise<PIQBOMappingType | null> {
    try {
      await dbConnect();
      const mapping = await PIQBOMapping.findOne({ _id: id, userId }).lean();
      return mapping ? JSON.parse(JSON.stringify(mapping)) : null;
    } catch (error) {
      throw new Error('Error fetching PI-QBO mapping from database');
    }
  }

  async getMappingsForPI(piId: string, userId: string): Promise<PIQBOMappingType[]> {
    try {
      await dbConnect();
      const mappings = await PIQBOMapping.find({ piId, userId }).lean();
      return JSON.parse(JSON.stringify(mappings));
    } catch (error) {
      throw new Error('Error fetching PI-QBO mappings for PI from database');
    }
  }

  async getMappingsForQBO(qboId: string, userId: string): Promise<PIQBOMappingType[]> {
    try {
      await dbConnect();
      const mappings = await PIQBOMapping.find({ qboId, userId }).lean();
      return JSON.parse(JSON.stringify(mappings));
    } catch (error) {
      throw new Error('Error fetching PI-QBO mappings for QBO from database');
    }
  }

  async createMapping(mappingData: Partial<PIQBOMappingType>, userId: string): Promise<PIQBOMappingType> {
    try {
      await dbConnect();
      const mapping = new PIQBOMapping({
        ...mappingData,
        userId
      });
      const savedMapping = await mapping.save();
      return JSON.parse(JSON.stringify(savedMapping));
    } catch (error: any) {
      // Check if it's a duplicate key error
      if (error.code === 11000) {
        throw new Error('A mapping between this PI and QBO already exists');
      }
      throw new Error('Error creating PI-QBO mapping in database');
    }
  }

  async updateMapping(
    id: string, 
    userId: string, 
    updateData: Partial<PIQBOMappingType>
  ): Promise<PIQBOMappingType | null> {
    try {
      await dbConnect();
      const updatedMapping = await PIQBOMapping.findOneAndUpdate(
        { _id: id, userId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
     
      return updatedMapping ? JSON.parse(JSON.stringify(updatedMapping)) : null;
    } catch (error: any) {
      // Check if it's a duplicate key error
      if (error.code === 11000) {
        throw new Error('A mapping between this PI and QBO already exists');
      }
      throw new Error('Error updating PI-QBO mapping in database');
    }
  }

  async deleteMapping(id: string, userId: string): Promise<boolean> {
    try {
      await dbConnect();
      const result = await PIQBOMapping.findOneAndDelete({ _id: id, userId });
      return !!result;
    } catch (error) {
      throw new Error('Error deleting PI-QBO mapping from database');
    }
  }
}