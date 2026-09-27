package com.warehouse.wms.amr.entity;

import java.time.LocalDateTime;

import com.warehouse.wms.bin.entity.Bin;
import com.warehouse.wms.warehouse.entity.Warehouse;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "amrs")
public class AMR {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Robot code is required")
    @Column(unique = true, nullable = false)
    private String robotCode;

    @NotNull(message = "AMR status is required")
    @Enumerated(EnumType.STRING)
    private AMRStatus status;

    @NotNull(message = "Battery level is required")
    @Min(value = 0, message = "Battery level cannot be less than 0")
    @Max(value = 100, message = "Battery level cannot be greater than 100")
    private Integer batteryLevel;

    @NotNull(message = "Warehouse is required")
    @ManyToOne
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne
    @JoinColumn(name = "current_bin_id")
    private Bin currentBin;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public AMR() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRobotCode() {
        return robotCode;
    }

    public void setRobotCode(String robotCode) {
        this.robotCode = robotCode;
    }

    public AMRStatus getStatus() {
        return status;
    }

    public void setStatus(AMRStatus status) {
        this.status = status;
    }

    public Integer getBatteryLevel() {
        return batteryLevel;
    }

    public void setBatteryLevel(Integer batteryLevel) {
        this.batteryLevel = batteryLevel;
    }

    public Warehouse getWarehouse() {
        return warehouse;
    }

    public void setWarehouse(Warehouse warehouse) {
        this.warehouse = warehouse;
    }

    public Bin getCurrentBin() {
        return currentBin;
    }

    public void setCurrentBin(Bin currentBin) {
        this.currentBin = currentBin;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

}
