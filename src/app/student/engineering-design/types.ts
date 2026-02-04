export interface DesignSpec {
  name: string;
  materials: string[];
  [key: string]: any;
}

export interface ArchitecturalSpec {
  name: string;
  buildingType: string;
  [key: string]: any;
}

export interface AutonomousVehicleSpec {
  name: string;
  [key: string]: any;
}

export interface BasicGeometrySpec {
  name: string;
  shape: 'cube' | 'sphere' | 'cylinder';
  dimensions: { width: number; height: number; depth: number };
  color: string;
  [key: string]: any;
}

export interface SimulationResult {
  verdict: string;
  [key: string]: any;
}

export interface DoorAndWindowSchedule {
  [key: string]: any;
}

export interface FinishSchedule {
  [key: string]: any;
}

export interface GroundedSearchResult {
  [key: string]: any;
}

export interface FabricationService {
    [key: string]: any;
}
